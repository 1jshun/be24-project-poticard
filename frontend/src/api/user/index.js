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

export default { login, signup, profile, checkEmailDuplicate }
