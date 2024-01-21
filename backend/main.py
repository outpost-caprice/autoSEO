import json
import flask
import os
import requests
from bs4 import BeautifulSoup
from openaiapi import seo_rival, openai_api_call


api_key = os.environ.get('GOOGLE_API_KEY')
cse_id = os.environ.get('GOOGLE_CSE_ID')

def process_json(json_data):
    try:
        section1 = json_data['section1']
        section2 = json_data['section2']
        main(section1, section2)
    except Exception as e:
        print(e)
        raise e  # 例外を再度発生させる
    
def google_search(query, api_key, cse_id, num_results=10):
    url = "https://www.googleapis.com/customsearch/v1"
    params = {
        'q': query,
        'cx': cse_id,
        'key': api_key,
        'num': num_results
    }
    response = requests.get(url, params=params)
    result = response.json()
    # 結果をリスト形式で返す。各要素は検索結果のURL
    return [item['link'] for item in result.get('items', [])]

# URLからコンテンツを取得する関数
def fetch_content_from_url(url):
    try:
        print(f"URLからコンテンツの取得を開始: {url}")

        # ユーザーエージェントを設定
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
        }

        response = requests.get(url, headers=headers, timeout=30)
        content = response.text

        print(f"URLからコンテンツの取得が成功: {url}")
        return content

    except Exception as e:
        print(f"URLからのコンテンツ取得中にエラーが発生しました: {e}")
        return ""
    
def parse_content(content):
    try:
        soup = BeautifulSoup(content, 'html.parser')

        # ヘッダー、フッター、スクリプト、スタイルの削除
        for element in soup(['header', 'footer']):
            element.decompose()

        text = soup.get_text()
        parsed_text = ' '.join(text.split())

        print(f"パースされたテキストの文字数: {len(parsed_text)}")
        return parsed_text

    except Exception as e:
        print(f"コンテンツのパース中にエラーが発生しました: {e}")
        return ""
    
def main(section1, section2):
    keywords = section1['keyword']
    results = {}

    for keyword in keywords:
        urls = google_search(keyword, api_key, cse_id)
        contents = []

        for url in urls:
            content = fetch_content_from_url(url)
            if content:
                parsed_content = parse_content(content)
                contents.append(parsed_content)

            results[url] = contents

    # 結果を文字列として組み立て
    results_content = ""
    for url, content_list in results.items():
        results_content += f"URL: {url}\n"
        for content in content_list:
            results_content += f"{content}\n\n"
        results_content += "\n\n"
    # 他の処理にresults_contentを使用することも可能
    seo_essense = seo_rival(results_content)
    # seo_essenseは後で使う
    # section1の各内容を取得
    expected_reader = section1['expected_reader']
    search_intent = section1['search_intent']
    goal = section1['goal']
    title = section1['title']
    # section2の各内容を取得
    entry = section2['entry']
    headline = section2['headline']
    outline = section2['outline']
    number_of_words = section2['number_of_words']
    must_KW = section2['must_KW']
    memo = section2['memo']
    # ここから下は、section2の内容を使ってコンテンツを作成する処理
    prompt = {
    f'あなたは優秀なSEOライターです。"""{seo_essense}"""を参考に、"""{expected_reader}"""向けの"""{search_intent}"""の検索意図に適したコンテンツを作成してください。' f'コンテンツの目的は"""{goal}"""です。タイトルは"""{title}"""です。'
}
    
    response = openai_api_call(
        
    )




            


    
# JSONデータの例
'''
{
  "section1": {
    "keyword": ["サンプルキーワード1", "サンプルキーワード2"],
    "expected_reader": "サンプル読者層",
    "search_intent": "情報提供",
    "goal": "読者の理解向上",
    "title": "サンプルタイトル"
  },
  "section2": {
    "entry": "サンプル項目",
    "headline": "サンプル見出し",
    "outline": "ここに概要が入ります",
    "number_of_words": 500,
    "must_KW": ["キーワード1", "キーワード2"],
    "memo": "ここにメモが入ります"
  }
}
'''