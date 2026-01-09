import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { pool } from './config/db.js';
import { addUserByAuto, addUserByManual } from './signup/Signup.AddUser.js';
import { sendCode } from './signup/Signup.EmailCode.js';
import {
  loginController,
  logoutController,
  checkSessionController,
} from './user/User.Controller.js';
import { rentItemController, getItemListController } from './rent/Rent.Controller.js';
import { getRentedListController, returnItemController } from './return/Return.Controller.js';
import { authCheck } from './utils/authCheck.js';

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

//라우팅
/**
 *  login
 */
app.post('/api/login', loginController); // 로그인 요청
app.post('/api/logout', logoutController); // 로그아웃 요청
app.get('/api/checkSession', checkSessionController); // 세션 확인용

/**
 * rent
 */
app.post('/api/rent', authCheck, rentItemController);
app.get('/api/getItemList', authCheck, getItemListController);

/**
 * return
 */
app.get('/api/getRentedItemList', authCheck, getRentedListController);
app.post('/api/returnItem', authCheck, returnItemController);

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
