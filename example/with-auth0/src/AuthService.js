import Auth0 from 'auth0-js';
import decode from 'jwt-decode';

/**
 * See: https://auth0.com/docs/quickstart/spa/react/03-session-handling
 */

const getTokenExpirationDate = (token) => {
  const decoded = decode(token);
  if (!decoded.exp) return null;
  const date = new Date(0);

  date.setUTCSeconds(decoded.exp);
  return date;
};

const isTokenExpired = (token) => {
  const date = getTokenExpirationDate(token);

  if (date === null) return false;

  const offsetSeconds = 0;

  // $FlowIssue: date is clearly not null because of the above check
  return !(date.valueOf() > (new Date().valueOf() + (offsetSeconds * 1000)));
};

export default class AuthService {
  constructor(id, domain) {
    this.auth = new Auth0({
      clientID: id,
      domain,
      responseType: 'token',
    });
  }

  logIn(params, onError) {
    this.auth.login(params, onError);
  }

  signUp(params, onError) {
    this.auth.signup(params, onError);
  }

  parseHash(hash) {
    const parsed = this.auth.parseHash(hash);

    if (parsed && parsed.idToken) {
      this.setToken(parsed.idToken);
    }
  }

  // Checks if there is a saved token and it's still valid
  loggedIn() {
    const token = this.getToken();
    return !!token && !isTokenExpired(token);
  }

  // Saves user token to local storage
  setToken(idToken) {
    try {
      localStorage.setItem('id_token', idToken);
    } catch (err) {
      console.error('Could not set id_token');
    }
  }

  // Retrieves the user token from local storage
  getToken() {
    try {
      return localStorage.getItem('id_token');
    } catch (err) {
      console.error('Error accessing item id_token from localStorage');
      return undefined;
    }
  }

  // Clear user token and profile data from local storage
  logOut() {
    try {
      localStorage.removeItem('id_token');
    } catch (err) {
      console.log('Error removing item id_token from localStorage');
    }
  }

  getProfile(cb) {
    this.auth.getProfile(this.getToken(), cb);
  }
}
