from paddleocr import PaddleOCR
import cv2
import numpy as np
import random
from sklearn.cluster import KMeans
import os
import tempfile
from PIL import Image
import subprocess
import platform
import shutil

class TimetableImagePreprocessor():
    # def __init__(self):
        # OCR 설정
        # ocr = PaddleOCR(
        #     use_angle_cls=True, # 이미지 회전 자동 보정
        #     lang='korean',  # 영어,숫자도 동시 인식
        #     rec_algorithm='SVTR_LCNet',  # 인식률 높이기
        #     det_db_box_thresh=0.5, # 텍스트 박스 기준점 (0 ~ 1) : 낮을수록 민감
        #     drop_score=0.3, # 인식 신뢰도 임계값 : 이 값보다 낮으면 무시
        #     show_log=False # 콘솔 로그 출력 비활성화
        # )

    def read_image(self, path):
        self.img = cv2.imread(path)

    def make_temp_folder(self):
        self.temp_dir = tempfile.mkdtemp(prefix="cropped_boxes_")

    def cluster_colors_with_kmeans(self):
        """
        이미지 색상 정보 군집화 -> 유사 색상 영역 추출
        :return: None
        """

        img_lab = cv2.cvtColor(self.img, cv2.COLOR_BGR2Lab) # 색상 군집화 : 색상을 RGB -> Lab으로 변환(밝기, 색상)
        self.h, self.w = self.img.shape[:2] # 이미지 높이, 너비 추출
        flat_img = img_lab.reshape((-1, 3)) # 이미지 평탄화 (각 픽셀 색상 군집화)

        kmeans = KMeans(n_clusters=15, random_state=42, n_init=10) # 색상을 n_clusters개로 나누기 위해 Kmeans 실행
        self.labels = kmeans.fit_predict(flat_img) # 클러스터링(각 픽셀 라벨링)
        self.clustered = kmeans.cluster_centers_[self.labels].reshape((self.h, self.w, 3)).astype(np.uint8) # 다시 이미지화


    def detect_grid_lines(self, save_path=None):
        """
        흐린 회색 격자선(수평/수직) 검출 및 이미지에 시각화
        :param save_path: 시각화된 이미지 저장 경로 (옵션)
        :return: None
        """
        gray = cv2.cvtColor(self.img, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (3, 3), 0)
        edges = cv2.Canny(blurred, 30, 100, apertureSize=3)

        lines = cv2.HoughLinesP(edges, rho=1, theta=np.pi / 180, threshold=80,
                                minLineLength=200, maxLineGap=10)

        self.grid_lines = []  # 수평/수직 선 목록
        self.grid_img = self.img.copy()

        if lines is not None:
            for line in lines:
                x1, y1, x2, y2 = line[0]
                if abs(x1 - x2) < 10 or abs(y1 - y2) < 10:  # 수직 또는 수평
                    self.grid_lines.append((x1, y1, x2, y2))
                    cv2.line(self.grid_img, (x1, y1), (x2, y2), (0, 255, 0), 1)

        # 저장 경로 지정
        if save_path:
            final_path = save_path
        else:
            final_path = os.path.join(self.temp_dir, "grid_overlay.png")

        cv2.imwrite(final_path, self.grid_img)
        print(f"✅ 그리드 이미지 저장 완료: {final_path}")

    def remove_duplicate_boxes(self, boxes, iou_threshold=0.95):
        """
        중복 박스 제거
        :param boxes: 일정 박스 좌표 리스트 (List)
        :param iou_threshold: 얼마나 겹치면 중복으로 판단할지 기준 값 (0~1)
        :return: kept : 중복 제거된 boxes (List)
        """

        def iou(box1, box2):
            x1, y1, x2, y2 = box1
            x1_, y1_, x2_, y2_ = box2
            inter_x1 = max(x1, x1_)
            inter_y1 = max(y1, y1_)
            inter_x2 = min(x2, x2_)
            inter_y2 = min(y2, y2_)
            inter_area = max(0, inter_x2 - inter_x1) * max(0, inter_y2 - inter_y1)  # 겹치는 부분 면적
            box1_area = (x2 - x1) * (y2 - y1)
            box2_area = (x2_ - x1_) * (y2_ - y1_)
            union_area = box1_area + box2_area - inter_area  # 전체 면적 (합집합 - 교집합)
            return inter_area / union_area if union_area else 0  # 1에 가까울수록 두 박스가 일치

        kept = []
        for box in boxes:
            if all(iou(box, k) < iou_threshold for k in kept):
                kept.append(box)  # 겹치지 않는 박스만 저장

        return kept

    def extract_text_boxes(self):
        """
        전체 요일이 담겨있는 박스, 전체 시간대가 담겨있는 박스, 일정박스 추출
        :return: {
            "schedule_boxes": [(x1, y1, x2, y2)...],
            "day_word_boxes": [(x1, y1, x2, y2)...],
            "time_word_boxes": [(x1, y1, x2, y2)...]
        }
        """

        self.boxes = []
        self.day_word_boxes = []
        self.time_word_boxes = []

        for label in np.unique(self.labels):
            mask = (self.labels.reshape((self.h, self.w)) == label).astype(np.uint8) * 255
            contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        for label in np.unique(self.labels):
            mask = (self.labels.reshape((self.h, self.w)) == label).astype(np.uint8) * 255
            contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

            for cnt in contours:
                x, y, bw, bh = cv2.boundingRect(cnt)
                area = bw * bh

                if area > 2000 and 50 < bw < self.w and 30 < bh < self.h:
                    # 요일 행
                    if y < self.h * 0.1 and bh < self.h * 0.07:
                        self.day_word_boxes.append((x, y, x + bw, y + bh))
                        continue

                    # 시간대 열
                    elif x < self.w * 0.2 and bw < self.w * 0.1:
                        self.time_word_boxes.append((x, y, x + bw, y + bh))
                        continue

                    roi = self.img[y:y + bh, x:x + bw]
                    roi_gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
                    _, roi_bin = cv2.threshold(roi_gray, 200, 255, cv2.THRESH_BINARY_INV)
                    if cv2.countNonZero(roi_bin) > 80:
                        self.boxes.append((x, y, x + bw, y + bh))

        self.boxes = self.remove_duplicate_boxes(self.boxes)

        return {
            "schedule_boxes": self.boxes,
            "day_word_boxes": self.day_word_boxes,
            "time_word_boxes": self.time_word_boxes
        }

    def save_temp_image(self):
        """
        일정 박스, 요일 박스, 시간대 박스 저장 (빈 이미지 자동 필터링)
        :return: self.temp_crop_dir : 저장된 이미지 폴더 경로
        """
        self.save_cropped_boxes(self.boxes, "box")
        self.save_cropped_boxes(self.day_word_boxes, "day")
        self.save_cropped_boxes(self.time_word_boxes, "time")
        return self.temp_dir

    def save_cropped_boxes(self, boxes, prefix):
        """
        박스 리스트에서 이미지 저장 (빈 이미지 자동 제외)
        :param boxes: [(x1, y1, x2, y2), ...]
        :param prefix: 저장 파일명 앞에 붙을 문자열 (box / day / time 등)
        """
        saved_idx = 1
        for (x1, y1, x2, y2) in sorted(boxes, key=lambda b: (b[1], b[0])):
            roi = self.img[y1:y2, x1:x2]
            roi_gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
            _, bin_img = cv2.threshold(roi_gray, 240, 255, cv2.THRESH_BINARY_INV)
            non_zero = cv2.countNonZero(bin_img)

            if non_zero < 30:
                print(f"🗑️ 삭제됨 (빈 이미지): {prefix}_{saved_idx}.png")
                continue

            path = os.path.join(self.temp_dir, f"{prefix}_{saved_idx:02}.png")
            cv2.imwrite(path, roi)
            print(f"✅ 저장 완료: {path}")
            saved_idx += 1


    def open_folder(self):
        """
        저장된 폴더를 OS에 맞게 자동으로 연다 (Mac 기준: Finder 열기).
        """
        if platform.system() == "Darwin":  # macOS
            subprocess.run(["open", self.temp_dir])
        elif platform.system() == "Windows":
            os.startfile(self.temp_dir)
        elif platform.system() == "Linux":
            subprocess.run(["xdg-open", self.temp_dir])
        else:
            print("⚠️ 자동 폴더 열기 기능은 이 운영체제에서 지원되지 않습니다.")

    def clean_temp_files(self):
        try:
            shutil.rmtree(self.temp_dir)
            print(f"📁 디렉토리 삭제됨: {self.temp_dir}")
        except Exception as e:
            print(f"⚠️ 디렉토리 삭제 실패: {self.temp_dir} ({e})")

    def preprocess(self, img_path):
        self.read_image(img_path)
        self.cluster_colors_with_kmeans()
        self.make_temp_folder()
        # self.detect_grid_lines()
        self.extract_text_boxes()
        self.save_temp_image()
        # self.delete_empty_images()
        # self.open_folder()

        return self.temp_dir




# test = TimetableImagePreprocessor()
# test.preprocess("sample_img/sample4.png")
