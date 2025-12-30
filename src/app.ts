import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { pool } from './config/db.js';
import { addUserByAuto, addUserByManual } from './signup/Signup.AddUser.js';
import { sendCode } from './signup/Signup.EmailCode.js';
import { UserController } from './user/User.Controller.js';
import { UserRepository } from './user/User.Repository.js';
import { UserService } from './user/User.Service.js';
import { rentItemController } from './rent/Rent.Controller.js';
import { getItemListController } from './rent/Rent.Controller.js';
import { getRentedListController, returnItemController } from './return/Return.Controller.js';

// express app
const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 8080;
/**
 * cloud api log code
 */
app.use((req, res, next) => {
  console.log(`[Request] Method: ${req.method}, Path: ${req.path}`);
  next();
});

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: ['http://localhost:3000', '*'],
    credentials: true,
  })
);

// 레이어별 인스턴스 생성 + 주입
const userRepository = new UserRepository(pool);
const userService = new UserService(userRepository);
const userController = new UserController(userService);

//라우팅
/**
 *  login
 */
app.post('/api/login', userController.login); // 로그인 요청
app.post('/api/logout', userController.logout); // 로그아웃 요청
app.get('/api/checkSession', userController.checkSession); // 세션 확인용

/**
 * rent
 */
app.post('/api/rent', rentItemController);
app.get('/api/getItemList', getItemListController);

/**
 * return
 */
app.get('/api/getRentedItemList', getRentedListController);
app.post('/api/returnItem', returnItemController);

/**
 *  signup
 */
app.post('/api/signup/auto', addUserByAuto); // 자동가입
app.post('/api/signup/manual', addUserByManual); //수동가입 공사중

/**
 *  email code
 */
app.post('/api/send-code', sendCode);
// app.get('/api/send-code', sendCode);

/**
 * healthcheck
 */
app.get('/health', (req, res) => {
  res.status(200).send({ status: 'OK' });
});
app.get('/health/db', async (_, res) => {
  try {
    const [rows] = await pool.query('SELECT 1');

    console.log('DB 연결 및 쿼리 성공', rows);

    return res.status(200).json({
      status: 'success',
      db: 'connected',
      result: rows,
    });
  } catch (error: any) {
    console.error('DB 연결 실패 (에러 전체):', error);

    return res.status(500).json({
      status: 'fail',
      message: error.message || 'DB connection failed',
    });
  }
});

app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
