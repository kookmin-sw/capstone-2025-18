from timetable_preprocess import TimetableImagePreprocessor
from gpt_api_parser import GPTApiParser
from schedule_mapper import ScheduleMapper
import requests
import pprint
import os

def main():
    # 1. 백엔드에서 이미지 받아오기
    DB_URL = os.getenv("DB_URL")
    response = requests.get(f"{DB_URL}/upload-timetable-image")

    if response.status_code != 200:
        print("❌ 이미지 데이터 받아오기 실패")
        return

    image_data = response.json()  # {'image_path': 'path/to/image.png'}
    img_path = image_data.get("image_path")

    # 이미지 전처리 및 bbox 추출
    preprocessor = TimetableImagePreprocessor()
    boxes_info, temp_dir = preprocessor.preprocess(img_path)

    box_dict = {}

    for filename, box in boxes_info["subjects"].items():
        box_dict[filename] = list(box)

    for filename, box in boxes_info["days"].items():
        box_dict[filename] = list(box)

    for filename, box in boxes_info["times"].items():
        box_dict[filename] = list(box)

    # GPT OCR 실행
    gpt_parser = GPTApiParser()
    text_dict = gpt_parser.run_gpt(temp_dir)

    # 좌표+텍스트 매핑
    days = {}
    times = {}
    subjects = {}

    for filename, box in box_dict.items():
        if filename.startswith("day"):
            text = text_dict['days'].get(filename, '')
            if text == '':
                continue
            days[filename] = {'text': text, 'box': box}
        elif filename.startswith("time"):
            text = text_dict['times'].get(filename, '')
            if text == '':
                continue
            times[filename] = {'text': text, 'box': box}
        elif filename.startswith("box"):
            text = text_dict['subjects'].get(filename, '')
            if text == '':
                continue
            subjects[filename] = {'text': text, 'box': box}

    bbox_dict = {
        'days': days,
        'times': times,
        'subjects': subjects
    }

    mapper = ScheduleMapper(bbox_dict)
    result = mapper.map()

    # 6. 백엔드 전송
    post_response = requests.post(f"{DB_URL}/upload-result", json=result)


def test():
    img_path = "sample_img/sample3.png"

    # 이미지 전처리 및 bbox 추출
    preprocessor = TimetableImagePreprocessor()
    boxes_info, temp_dir = preprocessor.preprocess(img_path)

    box_dict = {}

    for filename, box in boxes_info["subjects"].items():
        box_dict[filename] = list(box)

    for filename, box in boxes_info["days"].items():
        box_dict[filename] = list(box)

    for filename, box in boxes_info["times"].items():
        box_dict[filename] = list(box)

    # GPT OCR 실행
    gpt_parser = GPTApiParser()
    text_dict = gpt_parser.run_gpt(temp_dir)

    # 좌표+텍스트 매핑
    days = {}
    times = {}
    subjects = {}

    for filename, box in box_dict.items():
        if filename.startswith("day"):
            text = text_dict['days'].get(filename, '')
            if text == '':
                continue
            days[filename] = {'text': text, 'box': box}
        elif filename.startswith("time"):
            text = text_dict['times'].get(filename, '')
            if text == '':
                continue
            times[filename] = {'text': text, 'box': box}
        elif filename.startswith("box"):
            text = text_dict['subjects'].get(filename, '')
            if text == '':
                continue
            subjects[filename] = {'text': text, 'box': box}


    bbox_dict = {
        'days': days,
        'times': times,
        'subjects': subjects
    }

    pprint.pprint(bbox_dict)

    mapper = ScheduleMapper(bbox_dict)
    result = mapper.map()

    print(result)


if __name__ == "__main__":
    main()
    # test()