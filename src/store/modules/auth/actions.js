let timer;

export default {
  async login(context, payload) {
    return context.dispatch('auth', {
      ...payload,
      mode: 'login'
    })
  },
  async signup(context, payload) {
    return context.dispatch('auth', {
      ...payload,
      mode: 'signup'
    })
  },
  async auth(context, payload) {
    const mode = payload.mode
    let url = 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyC_jx6bjsL5O3NPZdphg6_7R7UkEbba25k';

    if (mode === 'signup') {
      url = 'https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=AIzaSyC_jx6bjsL5O3NPZdphg6_7R7UkEbba25k';
    }

    const response = await fetch(url , {
      method: 'POST',
      body: JSON.stringify({
        email: payload.email,
        password: payload.password,
        returnSecureToken: true
      })
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.log(responseData);
      const error = new Error(responseData.message || 'Failed to authenticate. Check your login data.');
      throw error;
    }

    const expiredIn = +responseData.expiresIn * 1000;
    // const expiredIn = 5000;
    const expirationDate = new Date().getTime() + expiredIn;

    localStorage.setItem('token', responseData.idToken);
    localStorage.setItem('userId', responseData.localId);
    localStorage.setItem('tokenExpiration', expirationDate);

    timer = setTimeout(function() {
      context.dispatch('autoLogout');
    } ,expiredIn)

    console.log(responseData);
    context.commit('setUser', {
      token: responseData.idToken,
      userId: responseData.localId
    });
  },
  tryLogin(context) {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const tokenExpiration = localStorage.getItem('tokenExpiration');

    const expiresIn = +tokenExpiration + new Date().getTime();

    if (expiresIn < 0) {
      return;
    }

    timer =  setTimeout(function() {
      context.dispatch('autoLogout');
    } ,expiresIn)

    if (token && userId) {
      context.commit('setUser', {
        token: token,
        userId: userId
      })
    }
  },
  autoLogout(context) {
    context.dispatch('logOut');
    context.commit('setAutoLogout');
  },
  logOut(context) {
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    localStorage.removeItem('tokenExpiration')

    clearTimeout(timer);

    context.commit('setUser', {
      userId: null,
      token: null
    })
  }
};