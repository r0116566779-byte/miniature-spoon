// بوت ماسنجر بسيط - يعرض قائمة أزرار للمستخدم
const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

// ==== إعدادات من ملف .env ====
const VERIFY_TOKEN = process.env.VERIFY_TOKEN; // كلمة تحقق تختارها أنت
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN; // رمز من فيسبوك

// ==== 1) التحقق من الويب هوك (يستخدمه فيسبوك مرة واحدة عند الربط) ====
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('تم التحقق من الويب هوك بنجاح');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// ==== 2) استقبال الرسائل من المستخدمين ====
app.post('/webhook', (req, res) => {
  const body = req.body;

  if (body.object === 'page') {
    body.entry.forEach((entry) => {
      const event = entry.messaging[0];
      const senderId = event.sender.id;

      if (event.message && event.message.text) {
        // المستخدم كتب رسالة نصية -> نرد بقائمة الأزرار
        sendButtonMenu(senderId);
      } else if (event.postback) {
        // المستخدم ضغط على زر
        handlePostback(senderId, event.postback.payload);
      }
    });
    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

// ==== إرسال قائمة أزرار للمستخدم ====
function sendButtonMenu(senderId) {
  const message = {
    attachment: {
      type: 'template',
      payload: {
        template_type: 'button',
        text: 'أهلاً بك! اختر من القائمة:',
        buttons: [
          {
            type: 'postback',
            title: '📦 معلومات عن الخدمة',
            payload: 'INFO',
          },
          {
            type: 'postback',
            title: '💬 تواصل مع الدعم',
            payload: 'SUPPORT',
          },
          {
            type: 'web_url',
            title: '🌐 زيارة الموقع',
            url: 'https://example.com',
          },
        ],
      },
    },
  };

  callSendAPI(senderId, message);
}

// ==== الرد حسب الزر اللي ضغط عليه المستخدم ====
function handlePostback(senderId, payload) {
  let replyText = '';

  switch (payload) {
    case 'INFO':
      replyText = 'هذا بوت تجريبي مبني بـ Node.js يشتغل على منصة ماسنجر.';
      break;
    case 'SUPPORT':
      replyText = 'تقدر تراسلنا هنا مباشرة وبنرد عليك بأقرب وقت.';
      break;
    default:
      replyText = 'لم أفهم طلبك، جرب اختيار من القائمة.';
  }

  callSendAPI(senderId, { text: replyText });

  // إعادة إرسال القائمة بعد الرد
  setTimeout(() => sendButtonMenu(senderId), 800);
}

// ==== دالة الإرسال العامة عبر Graph API ====
async function callSendAPI(senderId, message) {
  try {
    await axios.post(
      `https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
      {
        recipient: { id: senderId },
        message: message,
      }
    );
  } catch (error) {
    console.error('خطأ في الإرسال:', error.response?.data || error.message);
  }
}

// ==== تشغيل السيرفر ====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`البوت شغال على المنفذ ${PORT}`);
});
