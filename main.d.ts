export interface User {
    id:string;
    name:string;
    age:number;
}

export interface UserInsert extends Omit<User, "id">{};