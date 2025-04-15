from paddleocr import PaddleOCR
import cv2
import numpy as np
import random
from sklearn.cluster import KMeans

# OCR 설정 강화
ocr = PaddleOCR(
    use_angle_cls=True,
    lang='korean',  # 또는 'en'도 고려 가능
    rec_algorithm='SVTR_LCNet',  # 더 정교한 인식
    det_db_box_thresh=0.5,
    drop_score=0.3,
    show_log=False
)

def preprocess_roi(roi):
    # 확대 + 대비 증가 + 선명하게
    roi = cv2.resize(roi, None, fx=1.5, fy=1.5, interpolation=cv2.INTER_LINEAR)
    lab = cv2.cvtColor(roi, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(4,4))
    cl = clahe.apply(l)
    merged = cv2.merge((cl,a,b))
    roi_enhanced = cv2.cvtColor(merged, cv2.COLOR_LAB2BGR)
    return roi_enhanced

def extract_texts(cropped_img):
    result = ocr.ocr(cropped_img, cls=True)
    if not result or not result[0]:
        return []

    return [
        (text, round(conf, 2))
        for _, (text, conf) in result[0]
        if conf > 0.6  # 살짝 완화
    ]

# 중복 제거 함수 그대로 사용
def remove_duplicate_boxes(boxes, iou_threshold=0.95):
    def iou(box1, box2):
        x1, y1, x2, y2 = box1
        x1_, y1_, x2_, y2_ = box2
        inter_x1 = max(x1, x1_)
        inter_y1 = max(y1, y1_)
        inter_x2 = min(x2, x2_)
        inter_y2 = min(y2, y2_)
        inter_area = max(0, inter_x2 - inter_x1) * max(0, inter_y2 - inter_y1)
        box1_area = (x2 - x1) * (y2 - y1)
        box2_area = (x2_ - x1_) * (y2_ - y1_)
        union_area = box1_area + box2_area - inter_area
        return inter_area / union_area if union_area else 0
    kept = []
    for box in boxes:
        if all(iou(box, k) < iou_threshold for k in kept):
            kept.append(box)
    return kept

def expand_box_for_ocr(x1, y1, x2, y2, img_shape, margin=10):
    h, w = img_shape[:2]
    x1e = max(0, x1 - margin)
    y1e = max(0, y1 - margin)
    x2e = min(w, x2 + margin)
    y2e = min(h, y2 + margin)
    return x1e, y1e, x2e, y2e

def extract_title_line_text(result, box_height, top_ratio=0.4, height_threshold=0.8):
    if not result or not result[0]:
        return ""

    lines = []
    for line in result[0]:
        box, (text, conf) = line
        top = min(p[1] for p in box)
        bottom = max(p[1] for p in box)
        height = bottom - top
        lines.append({
            "text": text,
            "conf": conf,
            "top": top,
            "height": height
        })

    # 상단 40% 내의 텍스트
    top_lines = [l for l in lines if l["top"] < box_height * top_ratio]
    if not top_lines:
        return ""

    top_lines.sort(key=lambda l: l["top"])
    base_height = top_lines[0]["height"]

    # 제목과 유사한 높이만 추출
    title_lines = [
        l for l in top_lines
        if abs(l["height"] - base_height) / base_height < (1 - height_threshold)
    ]

    # 장소나 강의실 제외 (간단 키워드 필터링)
    exclude_keywords = ["호실", "관", "층", "실", "room", "Room"]
    filtered = [
        l["text"] for l in title_lines
        if not any(keyword in l["text"] for keyword in exclude_keywords)
    ]

    return " ".join(filtered)


# 이미지 로드 및 색상 클러스터링
img_path = "sample_img/sample4.png"
img = cv2.imread(img_path)
img_lab = cv2.cvtColor(img, cv2.COLOR_BGR2Lab)
h, w = img.shape[:2]
flat_img = img_lab.reshape((-1, 3))

kmeans = KMeans(n_clusters=15, random_state=42, n_init=10)
labels = kmeans.fit_predict(flat_img)
clustered = kmeans.cluster_centers_[labels].reshape((h, w, 3)).astype(np.uint8)

boxes = []
for label in np.unique(labels):
    mask = (labels.reshape((h, w)) == label).astype(np.uint8) * 255
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    for cnt in contours:
        x, y, bw, bh = cv2.boundingRect(cnt)
        area = bw * bh
        if 60 < bw < 300 and 60 < bh < 800 and area > 2000:
            roi = img[y:y+bh, x:x+bw]
            roi_gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
            _, roi_bin = cv2.threshold(roi_gray, 200, 255, cv2.THRESH_BINARY_INV)
            if cv2.countNonZero(roi_bin) > 80:
                boxes.append((x, y, x + bw, y + bh))

boxes = remove_duplicate_boxes(boxes)

# 시각화 및 OCR 적용
output_img = img.copy()
print(f"\n📦 최종 박스 개수: {len(boxes)}")
for i, (x1, y1, x2, y2) in enumerate(sorted(boxes, key=lambda b: (b[1], b[0])), 1):
    # 🎨 랜덤 색상 생성
    color = tuple(random.randint(0, 255) for _ in range(3))

    # 박스 그리기 (원래 좌표 기준)
    cv2.rectangle(output_img, (x1, y1), (x2, y2), color, 2)

    # 📌 마진 주는 건 OCR에만 적용
    x1e, y1e, x2e, y2e = expand_box_for_ocr(x1, y1, x2, y2, img.shape, margin=10)
    roi = img[y1e:y2e, x1e:x2e]

    # 📌 전처리
    roi_processed = preprocess_roi(roi)

    result = ocr.ocr(roi_processed, cls=True)
    titles = extract_title_line_text(result, y2e - y1e)

    print(f"\n📦 Box {i} ({x1}, {y1}, {x2}, {y2})")
    print(f"  🟩 [title] {titles}")

# 결과 이미지 저장
cv2.imwrite("test_result/sample4_boxed.png", output_img)
