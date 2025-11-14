const DATAVAULT_CONFIG = {
  BACKEND_URL: "https://datavault.0xstone.xyz/ndpaextension123/api/v1/analyze/link",
  
  MAX_RETRIES: 5,

  INITIAL_WAIT_TIME_MS: 1000,
  
  BUTTON_AUTO_REMOVE_MS: 30000
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = DATAVAULT_CONFIG;
}

