import pandas as pd
from numpy import random 

n = 1000
col1 = random.choice(list(range(100)),300)
col2 = random.choice(list(range(100)),300)

#df = pd.DataFrame({'sched_dep_time': col1, 'sched_arr_time': col2})
df = pd.DataFrame({'source': col1, 'target': col2})

#df = pd.read_csv("example.csv")
#df.to_json("example_cols.json")
df.to_json("example_rows.json", orient='records')

# Another graph
nodes = list(range(0,12))
col1 = [0,1,1,2,2,3,3,6,6, 7, 7, 3]
col2 = [1,2,3,4,5,6,7,8,9,10,11,11]
df = pd.DataFrame({'source': col1, 'target': col2})
df.to_json("example_1_rows.json", orient='records')

df = pd.read_csv("./bookings+pax_date.csv.gz");
df.to_json("./bookings+pax_date.json", orient='records');

df = pd.read_csv("./node_attributes_df.csv.gz");

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

cols = ['id','SCH_DEP_DTZ','SCH_ARR_DTZ','IN_DTMZ','OUT_DTMZ','OFF_DTMZ','ON_DTMZ']
cols_rot = ['ROTATION_AVAILABLE_TM','ROTATION_PLANNED_TM','ROTATION_REAL_TM']
df_cols = df[cols]
df_cols_rot = df[cols_rot]
#display(df_cols_rot)
print("df.shape: ", df.shape)

df.to_json("./node_attributes.json", orient='records')

#id,ACTUAL_BLOCK_HR,AIRCRAFT_TYPE,AIRLINE_DESIGNATOR_CD,ARR_DELAY_MINUTES,ARR_DELAY_MINUTES_DV,BANK OVERALL,BANK_CD,BASE_CD,CANCEL_CD,CAPACITY_C_CNT,CAPACITY_CNT,CAPACITY_Y_CNT,CLAVLOCOD,COUNT_ARR00,COUNT_ARR14,COUNT_ARR15,COUNT_ARR90,COUNT_CANCELLATIONS,COUNT_DEP00,COUNT_DEP05,COUNT_DEP15,COUNT_DEP80,COUNT_DLY_FLTS_ARR00,COUNT_DLY_FLTS_ARR14,COUNT_DLY_FLTS_D3H,COUNT_DLY_FLTS_DEP00,CREW_CNT,DEP_DELAY_MINUTES,DEST_CD,DWHLOAD_DTML,ETA_DTMZ,ETD_DTMZ,FLT_ACTUAL_HR,FLT_NUM,FLT_TYPE_CD,FLT_TYPE_NAME,HUB_STN,IN_DTMZ,LEG_STATUS_CD,OD,OFF_DTMZ,ON_DTMZ,OPERATED_CNT,ORIG_CD,ORIGIN_PLANNED,OUT_DTMZ,ROTATION_AVAILABLE_TM,ROTATION_PLANNED_TM,ROTATION_REAL_TM,SCH_ARR_DTL,SCH_ARR_DTML_PTY,SCH_ARR_DTMZ,SCH_ARR_DTZ,SCH_ARR_TML_PTY,SCH_ARR_TMZ,SCH_BLOCK_HR,SCH_DEP_DTL,SCH_DEP_DTML_PTY,SCH_DEP_DTMZ,SCH_DEP_DTZ,SCH_DEP_TML_PTY,SCH_DEP_TMZ,SCH_DEST_CD,SCHD_CNT_ALL,SCHEDULED_ALL,SCHEDULED_CNT,TAIL,TAXI_IN_MINUTES,TAXI_OUT_MINUTES,TIPO_OPR,AC_OWNER_CARRIER_CD,AIRCRAFT_TYPE_ICAO,IN,ON,OUT,OFF,AMPM
