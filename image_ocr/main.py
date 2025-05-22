from timetable_preprocess import TimetableImagePreprocessor
from gpt_api_parser import GPTApiParser
import requests

def main():
    # 1. 백엔드에서 이미지 및 좌표 정보 받아오기
    response = requests.get("https://your-api.com/get-image-data")
    if response.status_code != 200:
        print("❌ 이미지 데이터 받아오기 실패")
        return

    image_data = response.json()  # {'image_paths': [...], 'bbox_dict': {...}}
    bbox_dict = image_data.get("bbox_dict", {})
    image_paths = image_data.get("image_paths", [])  # 선택적으로 사용

    # 2. 이미지 전처리: 임시 폴더 생성, 좌표 시각화 등
    preprocessor = TimetableImagePreprocessor()
    temp_dir = preprocessor.preprocess(bbox_dict)  # -> temp 이미지 폴더 생성됨

    # 3. GPT OCR 실행 (임시 폴더 기준으로 이미지 인식)
    gpt_parser = GPTApiParser()
    text_dict = gpt_parser.run_gpt(temp_dir)  # -> {'day_01.png': '월요일', ...}

    # 4. 임시 폴더 삭제
    preprocessor.clean_temp_files()

    # 5. 좌표 + 텍스트 매핑 (클래스 없이 직접 처리)
    mapped_result = {}
    for filename, bbox in bbox_dict.items():
        text = text_dict.get(filename)
        if text is None:
            print(f"⚠️ 텍스트 없음: {filename}")
            text = ''
        mapped_result[filename] = {
            "text": text,
            "bbox": bbox
        }

    # 6. 백엔드에 최종 결과 전송
    post_response = requests.post("https://your-api.com/upload-result", json=mapped_result)
    if post_response.status_code == 200:
        print("✅ 결과 전송 성공")
    else:
        print("❌ 결과 전송 실패:", post_response.text)

if __name__ == "__main__":
    main()
