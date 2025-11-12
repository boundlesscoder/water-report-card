export function validatePwsid(req, res, next) {
    const { pwsid } = req.params;
  
    if (!pwsid || !/^\d{9}$/.test(pwsid)) {
        return res.status(400).json({ error: 'Invalid or missing PWSID' });
    }
  
    next();
}
  