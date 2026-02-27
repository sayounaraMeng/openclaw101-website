#!/usr/bin/env python3
"""
将 OpenClaw 101 所有 Markdown 文档内容读取并生成完整的 content.json
"""

import os
import json
import re

def read_markdown_file(filepath):
    """读取 Markdown 文件内容"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return ""

def parse_markdown(content, filename):
    """解析 Markdown 内容，提取标题和结构"""
    lines = content.split('\n')
    
    # 提取主标题
    title = ""
    for line in lines:
        if line.startswith('# '):
            title = line[2:].strip()
            break
    
    # 提取学习目标
    learning_goals = []
    in_goals = False
    for line in lines:
        if '学习目标' in line:
            in_goals = True
            continue
        if in_goals and line.startswith('## '):
            break
        if in_goals and line.strip() and not line.startswith('#'):
            learning_goals.append(line.strip())
    
    return {
        'title': title,
        'content': content,
        'learning_goals': learning_goals[:5]  # 最多5条
    }

def main():
    base_dir = '/root/.openclaw/workspace/openclaw101-learning'
    output_file = '/root/.openclaw/workspace/openclaw101-website/data/content-full.json'
    
    # 课程结构
    course_data = {
        'course': {
            'title': 'OpenClaw 101',
            'subtitle': '系统学习指南',
            'description': '专为已部署 OpenClaw 并连接飞书的数学老师设计，帮助你从"部署完成但不会用"进阶到"打造专属教研 AI 助手"',
            'duration': '7天',
            'dailyTime': '1-2小时',
            'totalDocs': 35
        },
        'days': []
    }
    
    # 遍历7天
    for day_num in range(1, 8):
        day_id = f'day{day_num:02d}'
        day_topics = []
        
        # 遍历每天的5个主题
        for topic_num in range(1, 6):
            filename = f'{day_id}-topic{topic_num:02d}.md'
            filepath = os.path.join(base_dir, filename)
            
            if os.path.exists(filepath):
                content = read_markdown_file(filepath)
                parsed = parse_markdown(content, filename)
                
                topic_data = {
                    'id': f'{day_id}-topic{topic_num:02d}',
                    'title': parsed['title'] or f'Topic {topic_num}',
                    'content': parsed['content'],
                    'learning_goals': parsed['learning_goals']
                }
                day_topics.append(topic_data)
                print(f"✅ Loaded: {filename}")
            else:
                print(f"⚠️ Missing: {filename}")
        
        # 添加天数信息
        day_titles = {
            1: ('Day 1：技能市场入门', '让机器人"有用"', '🚀'),
            2: ('Day 2：飞书场景深度整合', '飞书群里的机器人真正"智能"起来', '💬'),
            3: ('Day 3：数学老师专属', '教研辅助技能', '📐'),
            4: ('Day 4：记忆系统', '让机器人"记得住"', '🧠'),
            5: ('Day 5：自动化工作流', '真正省时间', '⚡'),
            6: ('Day 6：高级玩法探索', '进阶技巧', '🚀'),
            7: ('Day 7：打造专属教研AI助手', '完整工作流', '🎯')
        }
        
        day_info = day_titles.get(day_num, (f'Day {day_num}', '', '📚'))
        
        course_data['days'].append({
            'id': day_id,
            'title': day_info[0],
            'subtitle': day_info[1],
            'icon': day_info[2],
            'topics': day_topics
        })
    
    # 保存完整数据
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(course_data, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ Complete! Saved to: {output_file}")
    print(f"Total days: {len(course_data['days'])}")
    total_topics = sum(len(day['topics']) for day in course_data['days'])
    print(f"Total topics: {total_topics}")

if __name__ == '__main__':
    main()
