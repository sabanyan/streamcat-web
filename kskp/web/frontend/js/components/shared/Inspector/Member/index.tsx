import React from 'react'
import { useEffect, useRef, useState } from 'react';
import { Paper, TextField, TableContainer, Table, TableHead, TableRow, TableCell, TableBody } from '@material-ui/core';
import style from './style.scss'
import { Tab } from 'Components/shared/Base';

type Row = {
  createdAt: string;
  creator: string;
  email: string;
  name: string;
  state: string;
  type: string;
  uuid: string;
}

type Props = {
  rows: Row[];
  searchedRows: Row[];

  onSeachTextInputed: Function;
  onSeachedMemberClicked: Function;
  onMemberRoleChanged: Function;
  onDeleteMemberClicked: Function;
  onSaveClicked: Function;
}

export default function Member(props: Props) {
  const { rows, searchedRows } = props
  const { onSeachTextInputed } = props

  return <React.Fragment>
    <div className={style.paper}>
      <TextField
        id="seachFiled"
        label="追加するユーザーの名前、Email"
        onKeyUp={(e) => onSeachTextInputed(e)}
        className={style.searchField}
      />
      <div className={style.dropdown}>
        {
          searchedRows.map((row) => {
            <a href="javascript:void(0)">{row.name + " " + row.email}</a>
          })
        }
      </div>

      <TableContainer component={Paper} className={style.table}>
        <Table aria-label="member"  >
          <TableHead>
            <TableRow>
              <TableCell></TableCell>
              <TableCell></TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.email}>
                <TableCell component="th" scope="row">
                  {row.name}
                </TableCell>
                <TableCell>{row.email}</TableCell>
                <TableCell>{row.type}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  </React.Fragment>
}



function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function stableSort(array: Row[], comparator) {
  /*
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
  */
}


