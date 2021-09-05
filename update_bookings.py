import pandas as pd
import matplotlib.pyplot as plt
import numpy as np
from numpy import random 

book = pd.read_csv("./bookings+pax_date.csv.gz");
book.to_json("./bookings+pax_date.json", orient='records');

fsu = pd.read_csv("./node_attributes_df.csv.gz");
fsu.to_json("./node_attributes.json", orient="records");

# Update book DataFrame with the following attributes: 
# - IN, OUT, OFF, ON for feeder and outbound 

# I need the following fields
# Dep date TMZ
# Dep time TMZ
# Arr time TMZ
# Arr date TMZ
# ON, OFF, IN, OUT, TMZ
#### Computed fields
# Slack time
# Minimum rotation time
# Available time
# Connection slack time  (ACT - 45)

nano2min = 1. / 1e9 / 60
#available = (fsu_outbound.SCH_DEP_DTMZ - fsu_inbound.IN_DTMZ.values[0]) * nano2min;
#planned = (fsu_outbound.SCH_DEP_DTMZ - fsu_inbound.SCH_ARR_DTMZ.values[0]) * nano2min;

cols = ['id','SCH_DEP_DTMZ','SCH_ARR_DTMZ','IN_DTMZ','OUT_DTMZ','OFF_DTMZ','ON_DTMZ','TAIL']
cols_rot = ['ROTATION_AVAILABLE_TM','ROTATION_PLANNED_TM','ROTATION_REAL_TM']
cols.extend(cols_rot)

fsu = fsu[cols]

# Merge fsu and book dataframes. 
# Each is in fsu can appear multiple times i book

# Step 1: merge with 'id_f'
# Add "_ff" to all columns in FSU
# Add "_nff" to all columns in FSU
fsu_f  = fsu.copy()
fsu_nf = fsu.copy()
fsu_f.columns  = list(map(lambda x: x + "_ff",  fsu.columns))
fsu_nf.columns = list(map(lambda x: x + "_nff", fsu.columns))

newdf_f  = pd.merge(fsu_f, book, left_on='id_ff', right_on='id_f')
newdf_nf = pd.merge(fsu_nf, newdf_f, left_on='id_nff', right_on='id_nf') 

newdf_nf.drop(['id_ff','id_nff'], axis=1, inplace=True)

# Change all columns with _ff to _f and all columns with _nff to _nf
def editColumns(x):
    if x[-2:] == 'ff':
        return x[:-1]
    elif x[-3:] == 'nff':
        return x[:-1]
    else:
        return x

newdf_nf.columns = list(map(editColumns, newdf_nf.columns))
# enhanced to include ACT

df = newdf_nf.copy()
df['act_available'] = (df.SCH_DEP_DTMZ_nf - df.IN_DTMZ_f) * nano2min;
df['act_planned']   = (df.SCH_DEP_DTMZ_nf - df.SCH_ARR_DTMZ_f) * nano2min;
df['act_actual']   = (df.OUT_DTMZ_nf - df.IN_DTMZ_f) * nano2min;
df['act_slack']   = df['act_available'] - 45.
dff = df[['act_available','act_planned','act_slack']]

# Compute the in/out/total degree of full graph for the day
#  Each row is a connection:   
#    _f <==> _nf      equivalent 
#
#    to inbound <==> outbound

def degree(df):
    # Assumption: each pair inbound - outbound is unique

    # For each feeder, what are all the outbounds
    df['out_degree_f'] = df.groupby('id_f')['IN_DTMZ_f'].transform('size')

    #df['in_degree_f'] = np.nan
    #df['out_degree_nf'] = np.nan

    # For each outbound, what are all its feeders?
    df['in_degree_nf'] = df.groupby('id_nf')['IN_DTMZ_f'].transform('size')

    #plt.hist(out_degree, bins=30);
    #plt.savefig("out_deg.pdf")
    #plt.hist(in_degree, bins=30);
    #plt.savefig("in_deg.pdf");
    #print("in_degree:")
    #print(in_degree)
    #print("out_degree:")
    #print(out_degree)
    return df


df = degree(df)

df.to_json("./bookings_oneday.json", orient='records')

#dfdeg = df[['in_degree_f', 'out_degree_f', 'in_degree_nf', 'out_degree_nf']]
print(df.columns)
dfdeg = df[['od_f','od_nf','in_degree_nf', 'out_degree_f','SCH_DEP_DTMZ_nf']].sort_values(['od_nf','SCH_DEP_DTMZ_nf'])
dfdeg.to_csv("degrees.csv", index=False)
print(dfdeg.head(50))

pp = dff.hist('act_slack', bins=40)
plt.savefig("ACT_slack.png")

#available = (fsu_outbound.SCH_DEP_DTMZ - fsu_inbound.IN_DTMZ.values[0]) * nano2min;
#planned = (fsu_outbound.SCH_DEP_DTMZ - fsu_inbound.SCH_ARR_DTMZ.values[0]) * nano2min;

#id,ACTUAL_BLOCK_HR,AIRCRAFT_TYPE,AIRLINE_DESIGNATOR_CD,ARR_DELAY_MINUTES,ARR_DELAY_MINUTES_DV,BANK OVERALL,BANK_CD,BASE_CD,CANCEL_CD,CAPACITY_C_CNT,CAPACITY_CNT,CAPACITY_Y_CNT,CLAVLOCOD,COUNT_ARR00,COUNT_ARR14,COUNT_ARR15,COUNT_ARR90,COUNT_CANCELLATIONS,COUNT_DEP00,COUNT_DEP05,COUNT_DEP15,COUNT_DEP80,COUNT_DLY_FLTS_ARR00,COUNT_DLY_FLTS_ARR14,COUNT_DLY_FLTS_D3H,COUNT_DLY_FLTS_DEP00,CREW_CNT,DEP_DELAY_MINUTES,DEST_CD,DWHLOAD_DTML,ETA_DTMZ,ETD_DTMZ,FLT_ACTUAL_HR,FLT_NUM,FLT_TYPE_CD,FLT_TYPE_NAME,HUB_STN,IN_DTMZ,LEG_STATUS_CD,OD,OFF_DTMZ,ON_DTMZ,OPERATED_CNT,ORIG_CD,ORIGIN_PLANNED,OUT_DTMZ,ROTATION_AVAILABLE_TM,ROTATION_PLANNED_TM,ROTATION_REAL_TM,SCH_ARR_DTL,SCH_ARR_DTML_PTY,SCH_ARR_DTMZ,SCH_ARR_DTZ,SCH_ARR_TML_PTY,SCH_ARR_TMZ,SCH_BLOCK_HR,SCH_DEP_DTL,SCH_DEP_DTML_PTY,SCH_DEP_DTMZ,SCH_DEP_DTZ,SCH_DEP_TML_PTY,SCH_DEP_TMZ,SCH_DEST_CD,SCHD_CNT_ALL,SCHEDULED_ALL,SCHEDULED_CNT,TAIL,TAXI_IN_MINUTES,TAXI_OUT_MINUTES,TIPO_OPR,AC_OWNER_CARRIER_CD,AIRCRAFT_TYPE_ICAO,IN,ON,OUT,OFF,AMPM
