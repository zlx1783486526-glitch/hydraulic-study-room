(() => {
  'use strict';

  const config = window.HYDRAULIC_CLOUD_CONFIG || {};
  const app = window.HYDRAULIC_PROGRESS_API;
  const button = document.getElementById('cloud-account');
  if (!app || !window.supabase || !/^https:\/\//.test(config.url || '') || !config.key) return;

  const client = window.supabase.createClient(config.url, config.key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  const $ = id => document.getElementById(id);
  const dialog = $('cloud-dialog');
  const emailForm = $('cloud-email-form');
  const signedInPanel = $('cloud-signed-in');
  const status = $('cloud-status');
  const lastUserKey = 'hydraulic-tutor-cloud-user-v1';
  let session = null;
  let syncTimer = null;
  let syncInFlight = null;
  let sendingLink = false;

  button.hidden = false;

  function say(message, error=false) {
    status.textContent = message;
    status.classList.toggle('error', error);
  }
  function drawAccount() {
    const loggedIn = !!session?.user;
    emailForm.hidden = loggedIn;
    signedInPanel.hidden = !loggedIn;
    $('cloud-user-email').textContent = loggedIn ? (session.user.email || '') : '';
    button.querySelector('span').textContent = loggedIn ? '云端同步' : '登录同步';
    button.setAttribute('aria-label', loggedIn ? '查看云端同步状态' : '登录并同步学习进度');
  }
  function openDialog() {
    dialog.hidden = false;
    drawAccount();
    (session ? $('cloud-sync-now') : $('cloud-email')).focus();
  }
  function closeDialog() { dialog.hidden = true; }

  async function syncNow() {
    if (!session?.user) return false;
    if (syncInFlight) { await syncInFlight; return syncNow(); }
    syncInFlight = (async () => {
      try {
        if (!navigator.onLine) throw new Error('设备当前离线；进度已保存在本机，联网后会重试。');
        say('正在同步…');
        const userId = session.user.id;
        const { data, error } = await client.from('study_progress')
          .select('question_id,state,client_updated_at').eq('user_id', userId);
        if (error) throw error;
        if (session?.user?.id !== userId) return false;
        const remote = Object.fromEntries((data || []).map(row => {
          const state = row.state && typeof row.state === 'object' ? row.state : {};
          return [row.question_id, { ...state, updatedAt: Number(state.updatedAt) || Date.parse(row.client_updated_at) || 0 }];
        }));
        const upload = app.mergeRemote(remote);
        if (upload.length) {
          const rows = upload.map(([questionId, state]) => ({
            user_id: userId,
            question_id: questionId,
            state,
            client_updated_at: new Date(Number(state.updatedAt) || 1).toISOString()
          }));
          const { error: writeError } = await client.from('study_progress')
            .upsert(rows, { onConflict: 'user_id,question_id' });
          if (writeError) throw writeError;
        }
        if (session?.user?.id !== userId) return false;
        say(`已同步 ${Object.keys(app.get()).length} 道题的进度。`);
        button.querySelector('span').textContent = '已同步';
        return true;
      } catch (error) {
        say(`同步失败：${error.message || '请稍后重试。'}`, true);
        button.querySelector('span').textContent = '待同步';
        return false;
      }
    })();
    try { return await syncInFlight; }
    finally { syncInFlight = null; }
  }

  function scheduleSync(delay=600) {
    if (!session?.user) return;
    clearTimeout(syncTimer);
    button.querySelector('span').textContent = '待同步';
    syncTimer = setTimeout(syncNow, delay);
  }

  async function applySession(nextSession) {
    const previousId = session?.user?.id || null;
    const nextId = nextSession?.user?.id || null;
    session = nextSession;
    if (nextId) {
      const rememberedId = localStorage.getItem(lastUserKey);
      if (rememberedId && rememberedId !== nextId) app.clear();
      localStorage.setItem(lastUserKey, nextId);
      drawAccount();
      if (previousId !== nextId) await syncNow();
    } else {
      clearTimeout(syncTimer);
      if (previousId) {
        app.clear();
        localStorage.removeItem(lastUserKey);
      }
      drawAccount();
      say('登录后，同一邮箱在不同设备上会自动同步。');
    }
  }

  async function sendLink() {
    const email = $('cloud-email').value.trim();
    if (!emailForm.reportValidity()) return;
    if (/\@gmali\.com$/i.test(email)) {
      say('邮箱域名似乎写成了 gmali.com。请核对是否应为 gmail.com，再发送。', true);
      $('cloud-email').focus();
      return;
    }
    if (sendingLink) return;
    sendingLink = true;
    const submit = emailForm.querySelector('button[type="submit"]');
    submit.disabled = true;
    say('正在发送登录邮件…');
    try {
      const redirectTo = `${location.origin}${location.pathname}`;
      const { error } = await client.auth.signInWithOtp({
        email, options: { shouldCreateUser: true, emailRedirectTo: redirectTo }
      });
      if (error) {
        if (error.status === 429 || /rate limit/i.test(error.message || '')) {
          say('邮件发送次数已达上限。请约 1 小时后用核对无误的邮箱重试，期间不要连续发送。', true);
        } else {
          say(`发送失败：${error.message}`, true);
        }
        return;
      }
      say('发送请求已被接受。请检查这个邮箱的收件箱、垃圾邮件和拦截记录；收到后在当前设备打开链接。');
    } catch (error) {
      say(`发送失败：${error.message || '网络连接异常，请稍后重试。'}`, true);
    } finally {
      sendingLink = false;
      submit.disabled = false;
    }
  }

  button.addEventListener('click', openDialog);
  $('cloud-close').addEventListener('click', closeDialog);
  dialog.addEventListener('click', event => { if (event.target === dialog) closeDialog(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !dialog.hidden) closeDialog();
  });
  emailForm.addEventListener('submit', event => { event.preventDefault(); sendLink(); });
  $('cloud-sync-now').addEventListener('click', syncNow);
  $('cloud-sign-out').addEventListener('click', async () => {
    clearTimeout(syncTimer);
    if (!(await syncNow())) { say('退出前请先同步成功，或用右上角 ⇩ 导出备份。', true); return; }
    const { error } = await client.auth.signOut();
    if (error) say(`退出失败：${error.message}`, true);
  });
  document.addEventListener('hydraulic:progress-changed', () => scheduleSync());
  window.addEventListener('online', () => scheduleSync(100));
  window.addEventListener('focus', () => scheduleSync(100));
  client.auth.onAuthStateChange((_event, nextSession) => {
    setTimeout(() => applySession(nextSession), 0);
  });
  client.auth.getSession().then(({ data, error }) => {
    if (error) say(`登录状态读取失败：${error.message}`, true);
    else if (data.session) applySession(data.session);
  });
  drawAccount();
})();
