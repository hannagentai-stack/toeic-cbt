import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Đọc biến môi trường từ .env
const envPath = path.resolve(__dirname, '../.env');
let supabaseUrl = '';
let supabaseAnonKey = '';

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('VITE_SUPABASE_URL=')) {
      supabaseUrl = trimmed.split('=')[1].trim();
    } else if (trimmed.startsWith('VITE_SUPABASE_ANON_KEY=')) {
      supabaseAnonKey = trimmed.split('=')[1].trim();
    }
  }
}

console.log('=== BẮT ĐẦU RÀ SOÁT BẢO MẬT & KIỂM THỬ SUPABASE RLS ===\n');
console.log(`Supabase URL: ${supabaseUrl}`);
console.log(`Anon Key Prefix: ${supabaseAnonKey.substring(0, 20)}...`);

const anonClient = createClient(supabaseUrl, supabaseAnonKey);

async function runSecurityAudit() {
  const results: { check: string; result: string; fixNeeded: string }[] = [];

  // 1. Kiểm tra RLS bảng profiles với Anon Key
  try {
    const { data, error } = await anonClient.from('profiles').select('*');
    if (error) {
      results.push({
        check: 'RLS bảng profiles (Anon query)',
        result: `Chặn thành công (Lỗi: ${error.message})`,
        fixNeeded: 'Không (Đạt chuẩn)',
      });
    } else if (data && data.length === 0) {
      results.push({
        check: 'RLS bảng profiles (Anon query)',
        result: 'Chặn thành công (Trả về 0 bản ghi do RLS)',
        fixNeeded: 'Không (Đạt chuẩn)',
      });
    } else {
      results.push({
        check: 'RLS bảng profiles (Anon query)',
        result: `NGUY HIỂM: Rò rỉ ${data?.length} hồ sơ người dùng!`,
        fixNeeded: 'Cần siết chặt RLS bảng profiles',
      });
    }
  } catch (err: any) {
    results.push({
      check: 'RLS bảng profiles (Anon query)',
      result: `Bị từ chối: ${err.message}`,
      fixNeeded: 'Không (Đạt chuẩn)',
    });
  }

  // 2. Kiểm tra RLS bảng tests với Anon Key
  try {
    const { data, error } = await anonClient.from('tests').select('*');
    if (error) {
      results.push({
        check: 'RLS bảng tests (Anon query)',
        result: `Chặn thành công (Lỗi: ${error.message})`,
        fixNeeded: 'Không (Đạt chuẩn)',
      });
    } else if (data && data.length === 0) {
      results.push({
        check: 'RLS bảng tests (Anon query)',
        result: 'Chặn thành công (Trả về 0 bản ghi do RLS)',
        fixNeeded: 'Không (Đạt chuẩn)',
      });
    } else {
      // Nếu có data, kiểm tra xem có đề riêng tư nào bị lọt không
      const privateTests = data.filter((t: any) => !t.is_public);
      if (privateTests.length > 0) {
        results.push({
          check: 'RLS bảng tests (Anon query)',
          result: `NGUY HIỂM: Lọt ${privateTests.length} đề riêng tư!`,
          fixNeeded: 'Cần chặn đề riêng tư trong RLS',
        });
      } else {
        results.push({
          check: 'RLS bảng tests (Anon query)',
          result: 'Chỉ xem được đề công khai hoặc 0 bản ghi',
          fixNeeded: 'Không (Đạt chuẩn)',
        });
      }
    }
  } catch (err: any) {
    results.push({
      check: 'RLS bảng tests (Anon query)',
      result: `Bị từ chối: ${err.message}`,
      fixNeeded: 'Không (Đạt chuẩn)',
    });
  }

  // 3. Kiểm tra RLS bảng attempts với Anon Key
  try {
    const { data, error } = await anonClient.from('attempts').select('*');
    if (error) {
      results.push({
        check: 'RLS bảng attempts (Anon query)',
        result: `Chặn thành công (Lỗi: ${error.message})`,
        fixNeeded: 'Không (Đạt chuẩn)',
      });
    } else if (data && data.length === 0) {
      results.push({
        check: 'RLS bảng attempts (Anon query)',
        result: 'Chặn thành công (Trả về 0 bản ghi do RLS)',
        fixNeeded: 'Không (Đạt chuẩn)',
      });
    } else {
      results.push({
        check: 'RLS bảng attempts (Anon query)',
        result: `NGUY HIỂM: Lộ ${data.length} bài làm của thí sinh!`,
        fixNeeded: 'Cần siết chặt RLS bảng attempts',
      });
    }
  } catch (err: any) {
    results.push({
      check: 'RLS bảng attempts (Anon query)',
      result: `Bị từ chối: ${err.message}`,
      fixNeeded: 'Không (Đạt chuẩn)',
    });
  }

  // 4. Kiểm tra Anon cố tình ghi đè / đổi role trong profiles
  try {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const { data, error } = await anonClient
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', fakeId)
      .select();

    if (error) {
      results.push({
        check: 'Đổi role profiles bằng Anon Key',
        result: `Bị chặn thành công (Lỗi: ${error.message})`,
        fixNeeded: 'Không (Đạt chuẩn)',
      });
    } else if (!data || data.length === 0) {
      results.push({
        check: 'Đổi role profiles bằng Anon Key',
        result: 'Bị chặn hoàn toàn bởi RLS (0 dòng bị ảnh hưởng)',
        fixNeeded: 'Không (Đạt chuẩn)',
      });
    } else {
      results.push({
        check: 'Đổi role profiles bằng Anon Key',
        result: 'NGUY HIỂM: Có thể sửa role!',
        fixNeeded: 'Khóa ngay quyền update profiles',
      });
    }
  } catch (err: any) {
    results.push({
      check: 'Đổi role profiles bằng Anon Key',
      result: `Bị từ chối: ${err.message}`,
      fixNeeded: 'Không (Đạt chuẩn)',
    });
  }

  // 5. Kiểm tra truy cập Storage Bucket riêng tư test-media bằng Anon
  try {
    const { data, error } = await anonClient.storage.from('test-media').list();
    if (error) {
      results.push({
        check: 'Storage test-media (Anon listing)',
        result: `Chặn thành công (Lỗi: ${error.message})`,
        fixNeeded: 'Không (Đạt chuẩn)',
      });
    } else if (data && data.length === 0) {
      results.push({
        check: 'Storage test-media (Anon listing)',
        result: 'Chặn thành công (Không thấy file nào do RLS)',
        fixNeeded: 'Không (Đạt chuẩn)',
      });
    } else {
      results.push({
        check: 'Storage test-media (Anon listing)',
        result: `CẢNH BÁO: Thấy ${data?.length} files trong bucket`,
        fixNeeded: 'Cần kiểm tra lại policy storage.objects',
      });
    }
  } catch (err: any) {
    results.push({
      check: 'Storage test-media (Anon listing)',
      result: `Bị từ chối: ${err.message}`,
      fixNeeded: 'Không (Đạt chuẩn)',
    });
  }

  // 6. Kiểm tra .gitignore ở root và client
  const rootGitignore = path.resolve(__dirname, '../../.gitignore');
  const clientGitignore = path.resolve(__dirname, '../.gitignore');
  const rootIgnored = fs.existsSync(rootGitignore) && fs.readFileSync(rootGitignore, 'utf-8').includes('.env');
  const clientIgnored = fs.existsSync(clientGitignore) && fs.readFileSync(clientGitignore, 'utf-8').includes('.env');

  results.push({
    check: 'File .env có trong .gitignore không',
    result: rootIgnored && clientIgnored ? 'Đã có ở cả thư mục gốc và client' : 'Chưa đủ .gitignore',
    fixNeeded: rootIgnored && clientIgnored ? 'Không (Đạt chuẩn)' : 'Cần thêm .gitignore',
  });

  // 7. Kiểm tra service_role key trong code frontend
  let leakedServiceRole = false;
  const clientSrc = path.resolve(__dirname, '../src');
  function scanDir(dir: string) {
    for (const f of fs.readdirSync(dir)) {
      const p = path.join(dir, f);
      if (fs.statSync(p).isDirectory()) {
        scanDir(p);
      } else if (f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js')) {
        const text = fs.readFileSync(p, 'utf-8');
        if (text.includes('service_role') && !text.includes('Never expose your')) {
          leakedServiceRole = true;
        }
      }
    }
  }
  scanDir(clientSrc);

  results.push({
    check: 'Service_role key trong frontend/git',
    result: leakedServiceRole ? 'Phát hiện rò rỉ service_role!' : 'Không có bất kỳ service_role key nào',
    fixNeeded: leakedServiceRole ? 'Gỡ ngay key' : 'Không (Đạt chuẩn)',
  });

  // 8. Kiểm tra ghi log console nhạy cảm (password, access_token)
  let leakedConsoleLogs: string[] = [];
  function scanConsoleLogs(dir: string) {
    for (const f of fs.readdirSync(dir)) {
      const p = path.join(dir, f);
      if (fs.statSync(p).isDirectory()) {
        scanConsoleLogs(p);
      } else if (f.endsWith('.ts') || f.endsWith('.tsx')) {
        const text = fs.readFileSync(p, 'utf-8');
        const lines = text.split('\n');
        lines.forEach((line, idx) => {
          if (
            (line.includes('console.log') || line.includes('console.warn') || line.includes('console.error')) &&
            (line.toLowerCase().includes('password') || line.toLowerCase().includes('access_token') || line.toLowerCase().includes('refresh_token'))
          ) {
            leakedConsoleLogs.push(`${path.basename(p)}:${idx + 1}`);
          }
        });
      }
    }
  }
  scanConsoleLogs(clientSrc);

  results.push({
    check: 'Không log mật khẩu/token ra console',
    result: leakedConsoleLogs.length === 0 ? 'Sạch hoàn toàn (0 phát hiện)' : `Phát hiện: ${leakedConsoleLogs.join(', ')}`,
    fixNeeded: leakedConsoleLogs.length === 0 ? 'Không (Đạt chuẩn)' : 'Xóa log nhạy cảm',
  });

  // In bảng kết quả
  console.log('\n================ BẢNG KẾT QUẢ RÀ SOÁT BẢO MẬT ================');
  console.log('| Kiểm tra | Kết quả | Cần sửa |');
  console.log('|---|---|---|');
  for (const r of results) {
    console.log(`| ${r.check} | ${r.result} | ${r.fixNeeded} |`);
  }
  console.log('===============================================================\n');
}

runSecurityAudit();
