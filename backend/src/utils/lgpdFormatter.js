// src/utils/lgpdFormatter.js

/**
 * Mascara o e-mail (ex: j***e@email.com)
 * @param {string} email
 * @returns {string}
 */
function maskEmail(email) {
  if (!email) return email;
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  
  const [name, domain] = parts;
  if (name.length <= 2) {
    return `${name.charAt(0)}***@${domain}`;
  }
  
  return `${name.charAt(0)}***${name.charAt(name.length - 1)}@${domain}`;
}

/**
 * Mascara o telefone (ex: (11) 9****-1234)
 * @param {string} phone
 * @returns {string}
 */
function maskPhone(phone) {
  if (!phone) return phone;
  return phone.replace(/(\d{2})\s?(\d{4,5})-?(\d{4})/, (match, p1, p2, p3) => {
    return `(${p1}) ****-${p3}`;
  });
}

/**
 * Mascara o nome (ex: J*** D***)
 * @param {string} name
 * @returns {string}
 */
function maskName(name) {
  if (!name) return name;
  const parts = name.trim().split(/\s+/);
  return parts
    .map((p) => (p.length <= 2 ? `${p.charAt(0)}*` : `${p.charAt(0)}***${p.charAt(p.length - 1)}`))
    .join(' ');
}

/**
 * Máscara genérica de PII
 */
function maskPII(userOrSubmission) {
  if (!userOrSubmission) return userOrSubmission;

  const masked = { ...userOrSubmission };

  if (masked.name) masked.name = maskName(masked.name);
  if (masked.email) masked.email = maskEmail(masked.email);
  if (masked.phone) masked.phone = maskPhone(masked.phone);
  
  // Caso venha aninhado (ex: submission.user.email)
  if (masked.user) {
    masked.user = maskPII(masked.user);
  }
  
  if (masked.submissions && Array.isArray(masked.submissions)) {
    masked.submissions = masked.submissions.map(maskPII);
  }

  return masked;
}

module.exports = { maskEmail, maskPhone, maskName, maskPII };

