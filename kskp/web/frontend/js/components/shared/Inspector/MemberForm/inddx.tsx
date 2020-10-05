import React from 'react'
import { Paper, TextField, TableContainer, Table, TableBody } from '@material-ui/core';



type Row = {
  name : string;
  email: string;
  role : string;
}

function createData(name, email, role) : Row {
  return { name, email, role };
}

type Props = {
  rows : Row[];
  order: 'desc' | 'asc';
  orderBy: string;
  
  onSeachTextChagned: Function;
  onSeachedMemberClicked: Function;
  onMemberRoleChanged: Function;
  onDeleteMemberClicked: Function;
  onSaveClicked: Function;
  

}

export default function Member(props: Props) {
  const { rows, order, orderBy } = props

  return <React.Fragment>
    <Paper>
      <TextField id="seachFiled" label="追加するユーザーの名前、Email" />
      <TableContainer>
        <Table
          size={'small'}
        >
          <TableBody>
       
          </TableBody>
        </Table>

      </TableContainer>
    </Paper>

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

function stableSort(array:Row[], comparator) {
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


