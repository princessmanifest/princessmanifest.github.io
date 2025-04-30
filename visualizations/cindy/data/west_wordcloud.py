import pandas as pd
import re
from collections import defaultdict

# Load your dataset
file_path = 'final_complete_dataset.csv'  # Adjust the path if needed
df = pd.read_csv(file_path)

# Step 1: Define U.S. Census regions
region_map = {
    'Northeast': ['ME', 'NH', 'VT', 'MA', 'RI', 'CT', 'NY', 'NJ', 'PA'],
    'Midwest': ['OH', 'MI', 'IN', 'IL', 'WI', 'MN', 'IA', 'MO', 'ND', 'SD', 'NE', 'KS'],
    'South': ['DE', 'MD', 'DC', 'VA', 'WV', 'NC', 'SC', 'GA', 'FL',
              'KY', 'TN', 'MS', 'AL', 'OK', 'TX', 'AR', 'LA'],
    'West': ['MT', 'ID', 'WY', 'CO', 'NM', 'AZ', 'UT', 'NV', 'WA',
             'OR', 'CA', 'AK', 'HI']
}
state_to_region = {state: region for region, states in region_map.items() for state in states}
df['region'] = df['state_abbrev'].map(state_to_region)

# Step 2: Filter for West only
west_df = df[df['region'] == 'West'].copy()

# Step 4: Extract and clean object words
def extract_all_words(obj_str):
    if pd.isna(obj_str):
        return []
    words = []
    for item in obj_str.split(';'):
        if '(' in item:
            label = item.split('(')[0].lower()
            tokens = re.findall(r'\b[a-z]+\b', label)  # extract all words
            words.extend(tokens)
    return words

west_df['object_words'] = west_df['detected_objects'].apply(extract_all_words)
west_df['object_words'] = west_df['object_words'].apply(lambda words: [w for w in words if len(w) > 1])


# Step 5: Count frequency and average haunted score
word_freq = defaultdict(int)
word_score_sum = defaultdict(float)
word_score_count = defaultdict(int)

for words, score in zip(west_df['object_words'], west_df['Haunted Score']):
    for word in words:
        word_freq[word] += 1
        if pd.notna(score):
            word_score_sum[word] += score
            word_score_count[word] += 1

# Step 6: Final cleaned DataFrame
west_wordcloud_cleaned_df = pd.DataFrame([{
    "word": word,
    "frequency": word_freq[word],
    "avg_haunted_score": word_score_sum[word] / word_score_count[word] if word_score_count[word] else 0
} for word in word_freq if word_freq[word] >= 3])  # filter out low-frequency words

west_wordcloud_cleaned_df = west_wordcloud_cleaned_df.sort_values(by='frequency', ascending=False)

west_wordcloud_cleaned_df = west_wordcloud_cleaned_df.rename(columns={
    'word': 'text',
    'frequency': 'frequency',
    'avg_haunted_score': 'score'
})

# Select and export
west_wordcloud_cleaned_df[['text', 'frequency', 'score']].to_json(
    "west_wordcloud_d3.json", 
    orient='records', 
    indent=2
)
