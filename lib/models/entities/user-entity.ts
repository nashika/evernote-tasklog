import * as evernote from "evernote";

import SingleEntity from "./single-entity";

export class UserEntity extends evernote.Evernote.User implements SingleEntity {
}

export default UserEntity;
