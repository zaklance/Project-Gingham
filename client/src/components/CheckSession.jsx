async function userLoader({ request, params }) {
    const res = await fetch('http://127.0.0.1:5555/check_session', {
        method: 'GET',
        credentials: 'include'
      })
      .then(resp => {
        if (resp.ok) {
          return resp.json()
        } else {
          return {}
        }
      })
    return res
  }

  export default userLoader;