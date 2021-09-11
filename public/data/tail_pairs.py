import pandas as pd
import matplotlib.pyplot as plt
import numpy as np
from numpy import random 

df = tail_pairs = pd.read_csv("./tail_pairs_daterange.csv.gz");

#colnames = df.columns
df.columns =  ['id_f', 'id_nf', 'od_f', 'od_nf', 'tail_f', 'tail_nf', 'arrDTMZ_f', 'depDTMZ_nf', 'depdate_f', 'depdate_nf', 'dep_f', 'arr_f', 'dep_nf', 'arr_nf']

df.to_json("tail_pairs_daterange.json", orient='records')
