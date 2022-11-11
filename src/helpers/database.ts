import { FirebaseApp, initializeApp } from 'firebase/app';
import { Database, getDatabase, ref, set, get, child, onChildAdded } from 'firebase/database';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { conf } from '../../config.js';

class DatabaseService {
  app: FirebaseApp
  db: Database
  initSkip = true;

  constructor() {
    try{
      this.app = initializeApp({
        ...conf.firebase
      })

      const auth = getAuth();
      signInWithEmailAndPassword(auth, conf.authFirebase.email, conf.authFirebase.password)
        .catch((error) => {
          console.log(error)
        })

      this.db = getDatabase(this.app);

    } catch(err) {
      console.error('Application works without database!!');
      console.error(err);
    }
  }


  // получение всех юзеров для оповещения
  getUsers(): Promise<Collection<User>> {
    return new Promise((resolve, reject) => {
      get(child(ref(this.db), 'users'))
        .then((snapshot) => resolve(snapshot.val()))
        .catch(err => reject(err))
    })
  }


  // добавление слушателя оповещений
  setUserListner(user: User): Promise<void> {
    return new Promise((resolve, reject) => {
      set(ref(this.db, 'users/' + user.id), user)
      .then(() => resolve())
      .catch(err => reject(err))
    })
  }
  // подписка на обновления объявлений

  async updateAds(cb): Promise<void> {
    onChildAdded(ref(this.db, 'ads'), (snapshot) => {
      const data: Collection<Ad> = snapshot.val();

      // При первом запуске начинают лететь уже добавленные в базу поля
      // мы их скипаем, чтобы следить только за новыми
      setTimeout(() => {
        this.initSkip = false;
      })

      if(this.initSkip) {
        return
      }

      cb(data);
    })
  }
}

const db = new DatabaseService();
export default db;

export interface Collection<T> {
  [key: string]: T
}

export interface User {
  id: number,
  is_bot: boolean,
  first_name: string,
  username: string
}

export interface Ad {
  title: string,
  id: string,
  price: number,
  url: string
}
