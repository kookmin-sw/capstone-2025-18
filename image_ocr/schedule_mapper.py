import numpy as np
import pprint

class ScheduleMapper():
    def __init__(self, box_dict):
        self.all_bbox = box_dict
        self.day_dict = box_dict['days']
        self.time_dict = box_dict['times']
        self.subjects_dict = box_dict['subjects']

    def calculate_time_range(self):
        """
        일정 박스 기준으로 시작/끝 y좌표가 어느 시간 블록에 속하는지 찾아 계산 (15분 단위 반올림)
        """

        # 1. 시간 박스를 y1 기준 오름차순 정렬
        time_blocks = []
        for info in self.time_dict.values():
            hour = info["text"]
            x1, y1, x2, y2 = info["box"]
            time_blocks.append((y1, y2, hour))
        time_blocks.sort()  # 위에서 아래로 정렬

        results = {}
        for filename, info in self.subjects_dict.items():
            if not filename.startswith("box_"):
                continue

            x1, y1, x2, y2 = info["box"]
            start_min = None
            end_min = None

            for i, (block_y1, block_y2, hour) in enumerate(time_blocks):
                # 일정의 y1이 블록 안에 들어가면 시작 시간 계산
                if start_min is None and block_y1 <= y1 < block_y2:
                    ratio = (y1 - block_y1) / (block_y2 - block_y1)
                    start_min = int((hour * 60) + ratio * 60)
                    start_min = round(start_min / 15) * 15

                # 일정의 y2가 블록 안에 들어가면 종료 시간 계산
                if block_y1 < y2 <= block_y2:
                    ratio = (y2 - block_y1) / (block_y2 - block_y1)
                    end_min = int((hour * 60) + ratio * 60)
                    end_min = round(end_min / 15) * 15

            # 예외 처리: 박스가 여러 블록 걸쳐 있는 경우
            if start_min is None:
                first_block = time_blocks[0]
                start_min = first_block[2] * 60
                start_min = round(start_min / 15) * 15
            if end_min is None:
                last_block = time_blocks[-1]
                end_min = (last_block[2] + 1) * 60
                end_min = round(end_min / 15) * 15

            # 보정: end가 start보다 빠르면 최소 15분 추가
            if end_min <= start_min:
                end_min = start_min + 15

            start_str = f"{start_min // 60:02d}:{start_min % 60:02d}"
            end_str = f"{end_min // 60:02d}:{end_min % 60:02d}"

            results[filename] = {
                "start": start_str,
                "end": end_str
            }

        return results

    def map_day_index(self):
        # 요일을 왼쪽에서 오른쪽 순으로 정렬
        day_positions = []
        for filename, info in self.day_dict.items():
            label = info["text"]
            x1, y1, x2, y2 = info["box"]
            center_x = (x1 + x2) / 2
            day_positions.append((center_x, label))
        day_positions.sort()

        # 요일 이름 -> 인덱스
        day_name_to_index = {
            '일요일': 0,
            '월요일': 1,
            '화요일': 2,
            '수요일': 3,
            '목요일': 4,
            '금요일': 5,
            '토요일': 6
        }

        day_index_mapping = {}
        for idx, (_, name) in enumerate(day_positions):
            day_index_mapping[name] = day_name_to_index.get(name, -1)

        return day_index_mapping

    def build_schedule_json(self):
        time_ranges = self.calculate_time_range()
        day_index_mapping = self.map_day_index()
        schedule_json = []

        for filename, info in time_ranges.items():
            title = self.subjects_dict.get(filename, {}).get("text", "")
            box = self.subjects_dict[filename]["box"]
            center_x = (box[0] + box[2]) / 2

            closest_day = None
            min_dist = float('inf')
            for day_file, label in self.day_dict.items():
                day_box = self.day_dict[day_file]["box"]
                day_center_x = (day_box[0] + day_box[2]) / 2
                dist = abs(center_x - day_center_x)
                if dist < min_dist:
                    min_dist = dist
                    closest_day = label["text"]

            day_index = day_index_mapping.get(closest_day, -1)

            schedule_json.append({
                "day": day_index,
                "title": title,
                "start": info["start"],
                "end": info["end"]
            })

        return schedule_json

    def map(self):
        self.calculate_time_range()
        self.map_day_index()
        return self.build_schedule_json()


# test_dict = {'days': {'day_01.png': {'box': [63, 3, 207, 60], 'text': '월요일'},
#                       'day_02.png': {'box': [210, 3, 354, 60], 'text': '화요일'},
#                       'day_03.png': {'box': [357, 3, 501, 60], 'text': '수요일'},
#                       'day_04.png': {'box': [504, 3, 648, 60], 'text': '목요일'},
#                       'day_05.png': {'box': [651, 3, 795, 60], 'text': '금요일'},
#                       'day_06.png': {'box': [798, 3, 942, 60], 'text': '토요일'},
#                       'day_07.png': {'box': [945, 3, 1074, 60], 'text': '일요일'}},
#              'subjects': {'box_01.png': {'box': [945, 63, 1074, 195], 'text': '글로벌영어'},
#                           'box_02.png': {'box': [63, 468, 207, 669], 'text': '소프트웨어공학'},
#                           'box_03.png': {'box': [357, 468, 501, 669], 'text': '소프트웨어공학'},
#                           'box_04.png': {'box': [652, 604, 794, 870], 'text': 'BBC Worklife News and Discussions 1'},
#                           'box_05.png': {'box': [63, 873, 207, 1074], 'text': '머신러닝기초'},
#                           'box_06.png': {'box': [357, 873, 501, 1074], 'text': '머신러닝기초'},
#                           'box_07.png': {'box': [652, 874, 795, 1274], 'text': '다학제간캡스톤디자인'},
#                           'box_08.png': {'box': [63, 1074, 207, 1275], 'text': '인공지능하드웨어'},
#                           'box_09.png': {'box': [357, 1074, 501, 1275], 'text': '인공지능하드웨어'},
#                           'box_10.png': {'box': [651, 1278, 795, 1512], 'text': '자율주행자동차기술'}},
#              'times': {'time_01.png': {'box': [3, 63, 60, 195], 'text': 9},
#                        'time_02.png': {'box': [3, 198, 60, 330], 'text': 10},
#                        'time_03.png': {'box': [3, 333, 60, 465], 'text': 11},
#                        'time_04.png': {'box': [3, 468, 60, 600], 'text': 12},
#                        'time_05.png': {'box': [3, 603, 60, 735], 'text': 13},
#                        'time_06.png': {'box': [3, 738, 60, 870], 'text': 14},
#                        'time_07.png': {'box': [3, 873, 60, 1005], 'text': 15},
#                        'time_08.png': {'box': [3, 1008, 60, 1140], 'text': 16},
#                        'time_09.png': {'box': [3, 1143, 60, 1275], 'text': 17},
#                        'time_10.png': {'box': [3, 1278, 60, 1410], 'text': 18}}}
# test = ScheduleMapper(test_dict)
# pprint.pprint(test.map())