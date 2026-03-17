import { apiFetch } from '@/plugins/interceptor'

const getNamecardsInfo = async () => {
  try {
    const res = await apiFetch('json/namecards/namecardsFront')

    return res
  } catch (error) {
    console.error('명함 정보 호출 실패:', error.message)
  }
}

const getSingleNamecard = async (userId) => {
  try {
    const res = await apiFetch(`/namecard/singleUser?userId=${userId}`)
    return res
  } catch (error) {
    console.error('명함 정보 호출 실패:', error.message)
  }
}

const getNamecardList = async (page, size) => {
  try {
    const res = await apiFetch(`/namecard/list?page=${page-1}&size=${size}`)
    return res
  } catch (error) {
    console.error('명함 리스트 정보 호출 실패:', error.message)
  }
}

const editNamcard = async(cardData)=>{
  try{
    const namecard = await apiFetch(`/namecard/reg`, {
      method:'POST',
      body:{
        title:cardData.title,
        layout:cardData.layout,
        color:cardData.color,
        url:cardData.url,
        description:cardData.description
      }
    })
    const user = await apiFetch(`/user/nonessential`, {
        method:'POST',
        body:{
          address:cardData.address,
          affiliation:cardData.affiliation,
          career:cardData.career,
          gender:cardData.gender,
          profile_image:cardData.avatar
        }
      })
    } catch (error) {
    console.error('명함 리스트 정보 호출 실패:', error.message)
  }
}


export default {
  getSingleNamecard,
  getNamecardsInfo,
  getNamecardList,
  editNamcard
}
