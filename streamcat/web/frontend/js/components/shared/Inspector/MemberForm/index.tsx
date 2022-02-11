import React from 'react'
import { Paper, TextField, TableContainer, Table, TableRow, TableCell, TableBody, Select } from '@material-ui/core';
import style from './style.scss'
import Constants from 'Constants/index';
import { UserType } from 'Model/Navigation/NavigationModel';
import { Member } from 'Model/Library';

type Props = {
  members: Member[];
  searchedUsers: UserType[];
  onSearchTextInputed: (e, members:Member[]) => void;
  onSearchedMemberClicked: (e, members:Member[], newUser:UserType) => void;
  onMemberRoleChanged: (e, members:Member[], editMember:Member) => void;
}

export function MemberForm(props: Props) {
  const { members, searchedUsers } = props
  const { onSearchTextInputed, onSearchedMemberClicked, onMemberRoleChanged } = props

  const searchedUserLinks = searchedUsers.map(user => {
    return <a key={user.email}
              href="#"
              onClick={(e) => onSearchedMemberClicked(e, members, user)}>
      {user.name + " (" + user.email + ")"}
    </a>
  })

  const roleForm = (editMember:Member) => {
    return <Select
      native
      value={editMember.type ? editMember.type : "Reader"}
      onChange={(e) => onMemberRoleChanged(e, members, editMember)}
      className={style.role}>
      <option value="Owner">{Constants.projectMemberRole.OWNER}</option>
      <option value="Writer">{Constants.projectMemberRole.WRITER}</option>
      <option value="Reader">{Constants.projectMemberRole.READER}</option>
      <option className={style.highlight} value="Del">削除する</option>
    </Select>
  }

  return <React.Fragment>
    <div className={style.paper}>
      <TextField
        id="seachFiled"
        label="追加するユーザーの名前、Email"
        onChange={(e) => onSearchTextInputed(e, members)}
        className={style.searchField}
      />
      <div className={style.dropdown}>
        {searchedUserLinks}
      </div>

      <TableContainer component={Paper} className={style.table}>
        <Table aria-label="member">
          {/*
          <TableHead>
            <TableRow>
              <TableCell></TableCell>
              <TableCell></TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          */}
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.email}>
                <TableCell component="th" scope="row">
                  {member.name}
                </TableCell>
                <TableCell>{member.email}</TableCell>
                <TableCell>{roleForm(member)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  </React.Fragment>
}
