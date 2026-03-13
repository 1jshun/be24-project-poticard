import { apiFetch } from '@/plugins/interceptor'

const login = async (req) => {
  const res = await apiFetch('/user/login', {
    method: 'POST',
    body: req,
  })

  return res
}

const signup = async (req, type) => {
  const res = await apiFetch(`/user/signup?type=${type}`, {
    method: 'POST',
    body: {
      email: req.email,
      name: req.name,
      password: req.password,
      phone: req.phone
    },
  })

  return res
}

const profile = async (req) => {
  const token = localStorage.getItem('USERINFO')
  const res = await apiFetch('/user/profile', {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })

  return res
}

const checkEmailDuplicate = async (email) => {
  const res = await apiFetch('/user/check-email', {
    method: 'POST',
    body: { email },
  })

  return res
}

const subscribePush = async (subscription, userIdx) => {
  return await apiFetch('/push/sub', {
    method: 'POST',
    body: {
      userIdx: userIdx,
      endpoint: subscription.endpoint,
      keys: {
        p256dh: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('p256dh')))),
        auth: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('auth'))))
      }
    }
  });
};

export default { login, signup, profile, checkEmailDuplicate, subscribePush }
