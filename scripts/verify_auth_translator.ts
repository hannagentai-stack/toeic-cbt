import { translateAuthError } from '../client/src/utils/authErrorTranslator.js';

function runAuthErrorTests() {
  console.log('--- Kiểm thử hàm translateAuthError ---');

  const testCases = [
    {
      input: { message: 'Invalid login credentials' },
      expected: 'Email hoặc mật khẩu không chính xác',
    },
    {
      input: { message: 'Email not confirmed' },
      expected: 'Email của bạn chưa được xác nhận',
    },
    {
      input: { message: 'User already registered' },
      expected: 'Địa chỉ email này đã có tài khoản',
    },
    {
      input: { message: 'over_email_send_rate_limit' },
      expected: 'quá nhiều lần',
    },
    {
      input: { message: 'Failed to fetch' },
      expected: 'kết nối tới máy chủ',
    },
    {
      input: { message: 'Password should be at least 6 characters' },
      expected: 'Mật khẩu chưa đủ độ mạnh',
    },
  ];

  let passed = 0;
  for (const tc of testCases) {
    const result = translateAuthError(tc.input);
    const matches = result.toLowerCase().includes(tc.expected.toLowerCase());
    if (matches) {
      console.log(`✓ [PASS]: "${tc.input.message}" -> "${result}"`);
      passed++;
    } else {
      console.error(`✗ [FAIL]: "${tc.input.message}" -> Got "${result}", expected to contain "${tc.expected}"`);
    }
  }

  if (passed === testCases.length) {
    console.log(`\n Tất cả ${passed}/${testCases.length} ca kiểm thử thông báo lỗi tiếng Việt đều THÀNH CÔNG!`);
  } else {
    process.exit(1);
  }
}

runAuthErrorTests();
