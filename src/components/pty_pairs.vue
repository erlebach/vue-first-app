
  <!-- :value="ptyPairTable" -->
  <DataTable
    :value="ptyPairsRef.table"
    :scrollable="true"
    :resizableColumns="true"
    scrollHeight="300px"
  >
<template #header>
      <h2>
        Flight Pairs through PTY (endpoint), {{ ptyPairsRef.nbRows }} entries
      </h2>
      <span>Time of day: </span>
      <!-- Only show when table is visible -->
      <!-- What is type=? -->
      <InputText type="text" v-model.trim="ptyPairsRef.time" />
      <!-- v-on:keyup.enter="confirmEntry" -->
      <!-- Consider a set of checkboxes to turn columns on and off -->
      <span>City (for graph): </span>
      <InputText type="text" v-model.trim="ptyPairsRef.city" />
    </template>
    <Column field="id_f" header="In id" :sortable="true" style="display: none;">
    </Column>
    <Column
      field="id_nf"
      header="Out id"
      :sortable="true"
      style="display: none;"
    >
    </Column>
    <Column field="orig_f" header="Org" :sortable="true" :style="col"> </Column>
    <Column field="dest_f" header="Stop" :sortable="true" :style="col">
    </Column>
    <Column field="dest_nf" header="Dst" :sortable="true"> </Column>
    <Column field="fltnumPair" header="Flt#s" :sortable="true"> </Column>
    <Column field="status_f" header="StatusIn" :sortable="true"> </Column>
    <Column field="status_nf" header="Statusout" :sortable="true"> </Column>
    <Column field="tail" header="Tail" :sortable="true"> </Column>

    <Column field="sch_dep_z_f" header="sch_dep_f" :sortable="true"> </Column>
    <Column field="sch_arr_z_f" header="sch_arr_f" :sortable="true"> </Column>
    <Column field="est_rotation" header="estRot(min)" :sortable="true">
    </Column>
    <Column field="sch_dep_z_nf" header="sch_dep_nf" :sortable="true"> </Column>
    <Column field="sch_arr_z_nf" header="sch_arr_nf" :sortable="true"> </Column>
  </DataTable>
