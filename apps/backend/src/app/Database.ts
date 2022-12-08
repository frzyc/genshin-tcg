import { User } from "./type"

function newUser(name: string): User {
  return {
    name,
    history: [],
  }
}
export class Database {
  data = {} as { [user: string]: User }

  get(name: string) {
    this.data[name] ??= newUser(name)
    return this.data[name]
  }
  set(name: string, usr: User) {
    this.data[name] = usr
  }
}
