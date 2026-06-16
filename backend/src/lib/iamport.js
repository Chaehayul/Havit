const axios = require('axios');

const IAMPORT_API_URL = 'https://api.iamport.kr';

async function getAccessToken() {
  const { data } = await axios.post(`${IAMPORT_API_URL}/users/getToken`, {
    imp_key: process.env.IMP_KEY,
    imp_secret: process.env.IMP_SECRET,
  });
  if (data.code !== 0) throw new Error('PortOne 인증 실패');
  return data.response.access_token;
}

async function getPaymentInfo(impUid) {
  const token = await getAccessToken();
  const { data } = await axios.get(`${IAMPORT_API_URL}/payments/${impUid}`, {
    headers: { Authorization: token },
  });
  if (data.code !== 0) throw new Error('결제 정보 조회 실패');
  return data.response;
}

async function cancelPayment(impUid, reason, amount) {
  const token = await getAccessToken();
  const body = { imp_uid: impUid, reason };
  if (amount) body.amount = amount;
  const { data } = await axios.post(`${IAMPORT_API_URL}/payments/cancel`, body, {
    headers: { Authorization: token },
  });
  if (data.code !== 0) throw new Error('결제 취소 실패');
  return data.response;
}

module.exports = { getAccessToken, getPaymentInfo, cancelPayment };
