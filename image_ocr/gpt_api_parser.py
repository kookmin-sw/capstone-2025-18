import openai
import os
import glob
import base64
import cv2
import ast
from dotenv import load_dotenv

class GPTApiParser():
    def __init__(self):
        load_dotenv()

        # OpenAI 클라이언트 초기화
        self.client = openai.OpenAI(
            api_key = os.getenv("OPENAI_API_KEY")
        )

    def image_to_base64(self, image_path):
        with open(image_path, "rb") as img_file:
            return base64.b64encode(img_file.read()).decode("utf-8")

    def query_gpt_with_images(self, image_paths, prompt):
        image_data_uris = [
            {
                "type": "image_url",
                "image_url": {"url": f"data:image/png;base64,{self.image_to_base64(p)}"}
            } for p in image_paths
        ]

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "user", "content": [{"type": "text", "text": prompt}] + image_data_uris}
                ],
                max_tokens=1000
            )
            gpt_output = response.choices[0].message.content.strip()
            print("\n📋 GPT 응답 원본:\n", gpt_output)

            try:
                parsed = ast.literal_eval(gpt_output)
                print("\n✅ 파싱된 딕셔너리:", parsed)
                return parsed
            except Exception as parse_err:
                print("\n❌ 파싱 실패:", parse_err)
                return {"error": gpt_output}

        except Exception as e:
            print("❌ GPT 요청 실패:", e)
            return {"error": str(e)}

    def summarize_all_results(self, results):
        """
        이미지별 인식 결과를 GPT에게 전달해서 전체 요약 정리 받기
        """
        content_lines = [f"{r['filename']} → {r['result']}" for r in results]
        full_text = "\n".join(content_lines)

        prompt = (
            "다음은 시간표 이미지에서 인식한 텍스트 정보야."
            "요일은 월~금 순서, 시간은 24시간 기준으로 정렬해줘."
            "일정은 일정 제목만 뽑아줘."
            "일정명, 시간대, 요일을 각각 리스트 형태로 줘."
            "다른 말은 하지마. 복붙해서 파이썬에서 바로 쓸거야."
            + full_text
        )

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=1000
            )
            gpt_output = response.choices[0].message.content.strip()
            print("\n📋 최종 요약 정리 (원본 출력):\n")
            print(gpt_output)

            # 문자열 → 딕셔너리 파싱 시도
            try:
                parsed_dict = ast.literal_eval(gpt_output)
                print("\n✅ 파싱된 딕셔너리:\n", parsed_dict)
                return parsed_dict
            except Exception as parse_err:
                print("\n❌ 딕셔너리 파싱 실패:", parse_err)
                return None

        except Exception as e:
            print("❌ 요약 요청 중 오류:", e)
            return None

    def read_image_folder(self, dir_path):
        image_paths = sorted(glob.glob(os.path.join(dir_path, "*.png")))
        print(f"🔍 총 {len(image_paths)}장의 이미지 처리 중...")

        day_imgs = [p for p in image_paths if os.path.basename(p).startswith("day")]
        time_imgs = [p for p in image_paths if os.path.basename(p).startswith("time")]
        box_imgs = [p for p in image_paths if os.path.basename(p).startswith("box")]

        def process_group_to_dict(imgs, prompt_key):
            # 각 그룹별 프롬프트 설정
            prompts = {
                "day": (
                    "다음 이미지들은 요일 정보야. 영어라면 한글로 바꿔줘."
                    " 각 이미지 안의 텍스트를 인식해서 요일명을 리스트로 정리해줘."
                    " ['월요일', '화요일', ...] 같은 형식으로. 다른 말은 하지마."
                ),
                "time": (
                    "다음은 연속된 시간대 정보야. 이미지 안의 숫자를 추출해서 24시간제 숫자 리스트로 만들어줘."
                    " 반드시 24시간제로 변환해서 리스트로 만들어줘."
                    " 12시 이후는 13, 14, ... 이런 식으로 이어져야 해."
                    " 예: [9, 10, 11, ...]. 다른 말은 하지마."
                ),
                "box": (
                    "아래는 수업 정보가 담긴 이미지야."
                    " 각 수업의 제목만 리스트로 정리해줘. 예: ['논리회로설계', ...]"
                    " 다른 말은 하지마."
                )
            }[prompt_key]

            values = self.query_gpt_with_images(imgs[:10], prompts)
            return dict(zip([os.path.basename(p) for p in imgs[:10]], values))


        print("\n🗂️ 요일 이미지 처리 중...")
        days = process_group_to_dict(day_imgs, "day")

        print("\n🗂️ 시간 이미지 처리 중...")
        times = process_group_to_dict(time_imgs, "time")

        print("\n🗂️ 일정 이미지 처리 중...")
        subjects = process_group_to_dict(box_imgs, "box")

        # 최종 결과 딕셔너리 형태로 통합
        final_result = {
            "days": days,
            "times": times,
            "subjects": subjects
        }

        print("\n📦 최종 구조화된 데이터:")
        print(final_result)
        return final_result

    def api_test(self):
        try:
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "user", "content": "Hello, GPT!"}],
                max_tokens=10
            )
            print("✅ API 연결 성공!")
            print("📨 응답:", response.choices[0].message.content.strip())
        except Exception as e:
            print("❌ API 연결 실패:", e)

    def run_gpt(self, path):
        # self.api_test()
        return self.read_image_folder(path)


# gpt_parser = GPTApiParser()
# gpt_parser.run_gpt("/private/var/folders/6_/b3xjz4c918v2ld372n210zch0000gn/T/cropped_boxes_dapgrdwz")