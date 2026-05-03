(function () {
  "use strict";

  const FIELD_SELECTOR = [
    "input:not([type='hidden']):not([type='button']):not([type='submit']):not([type='reset'])",
    "select",
    "textarea"
  ].join(",");

  const SKIPPED_TYPES = new Set(["button", "submit", "reset", "hidden"]);
  const VALIDATED_CLASS = "cp-validated";
  const FEEDBACK_CLASS = "cp-validation-feedback";

  function lower(value) {
    return String(value || "").toLowerCase();
  }

  function fieldKey(field) {
    return lower(`${field.name || ""} ${field.id || ""} ${field.type || ""}`);
  }

  function cleanLabel(label) {
    return String(label || "")
      .replace(/\*/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function getLabel(field) {
    if (field.id) {
      const explicit = document.querySelector(`label[for="${CSS.escape(field.id)}"]`);
      if (explicit) return cleanLabel(explicit.textContent);
    }

    const wrapper = field.closest(".mb-3, .mb-4, .col-md-6, .col-md-4, .col-12, .form-group");
    const label = wrapper ? wrapper.querySelector("label") : null;
    return cleanLabel(label ? label.textContent : field.name || field.id || "Ce champ");
  }

  function isSkippable(field) {
    if (!field || field.disabled) return true;
    if (field.readOnly && field.type !== "checkbox") return true;
    if (SKIPPED_TYPES.has(lower(field.type))) return true;
    if (field.type === "search" && !field.required && !field.dataset.validation) return true;
    return false;
  }

  function hasRule(field) {
    const key = fieldKey(field);
    return Boolean(
      field.required ||
      field.pattern ||
      field.minLength > 0 ||
      field.maxLength > 0 ||
      field.min ||
      field.max ||
      field.dataset.validation ||
      field.dataset.match ||
      field.type === "email" ||
      field.type === "password" ||
      field.type === "number" ||
      key.includes("email") ||
      key.includes("mail") ||
      key.includes("cin") ||
      key.includes("telephone") ||
      key.includes("phone") ||
      key.includes("code_postal") ||
      key.includes("latitude") ||
      key.includes("longitude") ||
      key.includes("verification_code") ||
      key.includes("code_reinitialisation") ||
      key.includes("mot_de_passe") ||
      key.includes("password") ||
      key.includes("description")
    );
  }

  function feedbackId(field) {
    const base = field.id || field.name || Math.random().toString(36).slice(2);
    return `cp-feedback-${base.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
  }

  function getFeedback(field) {
    if (!field.id && !field.name) return null;

    const id = field.dataset.cpFeedbackId;
    if (id) {
      const existing = document.getElementById(id);
      if (existing) return existing;
    }

    const wrapper = field.closest(".mb-3, .mb-4, .col-md-6, .col-md-4, .col-12, .form-group, .modal-body");
    const reusable = wrapper
      ? wrapper.querySelector(`.${FEEDBACK_CLASS}, .invalid-feedback, [id^="err_"]`)
      : null;

    if (reusable) {
      if (!reusable.id) reusable.id = feedbackId(field);
      reusable.classList.add(FEEDBACK_CLASS);
      field.dataset.cpFeedbackId = reusable.id;
      appendDescribedBy(field, reusable.id);
      return reusable;
    }

    const feedback = document.createElement("div");
    feedback.id = feedbackId(field);
    feedback.className = FEEDBACK_CLASS;
    feedback.setAttribute("aria-live", "polite");

    const inputGroup = field.closest(".input-group");
    const checkGroup = field.closest(".form-check");
    const anchor = inputGroup || checkGroup || field;
    anchor.insertAdjacentElement("afterend", feedback);

    field.dataset.cpFeedbackId = feedback.id;
    appendDescribedBy(field, feedback.id);
    return feedback;
  }

  function appendDescribedBy(field, id) {
    const current = (field.getAttribute("aria-describedby") || "").split(/\s+/).filter(Boolean);
    if (!current.includes(id)) {
      current.push(id);
      field.setAttribute("aria-describedby", current.join(" "));
    }
  }

  function setFeedback(field, state, message) {
    const feedback = getFeedback(field);
    if (!feedback) return;

    feedback.textContent = message || "";
    feedback.classList.remove("is-valid", "is-invalid");
    if (state) feedback.classList.add(state === "valid" ? "is-valid" : "is-invalid");
  }

  function setFieldState(field, state, message, force) {
    field.classList.remove("is-valid", "is-invalid", "invalid");

    if (!state || (!force && !field.classList.contains(VALIDATED_CLASS))) {
      setFeedback(field, "", "");
      return;
    }

    field.classList.add(VALIDATED_CLASS);

    if (state === "invalid") {
      field.classList.add("is-invalid", "invalid");
      field.setAttribute("aria-invalid", "true");
      setFeedback(field, "invalid", message);
      return;
    }

    field.classList.add("is-valid");
    field.removeAttribute("aria-invalid");
    setFeedback(field, "valid", message || "Valide.");
  }

  function isEmpty(field) {
    if (field.type === "checkbox") return !field.checked;
    if (field.tagName === "SELECT") return field.value === "";
    return String(field.value || "").trim() === "";
  }

  function invalid(message) {
    return { valid: false, message };
  }

  function valid(message) {
    return { valid: true, message: message || "Valide." };
  }

  function optionalEmpty(field) {
    return !field.required && isEmpty(field);
  }

  function patternMatches(pattern, value) {
    try {
      const source = pattern.startsWith("^") ? pattern : `^(?:${pattern})$`;
      return new RegExp(source).test(value);
    } catch (error) {
      return true;
    }
  }

  function minLength(field, fallback) {
    if (field.dataset.minlength) return parseInt(field.dataset.minlength, 10);
    if (field.minLength && field.minLength > 0) return field.minLength;
    return fallback || 0;
  }

  function maxLength(field) {
    if (field.dataset.maxlength) return parseInt(field.dataset.maxlength, 10);
    if (field.maxLength && field.maxLength > 0) return field.maxLength;
    return 0;
  }

  function findMatchField(field) {
    if (!field.form) return null;

    const explicit = field.dataset.match;
    if (explicit) {
      return field.form.querySelector(explicit) || document.querySelector(explicit);
    }

    const passwords = Array.from(field.form.querySelectorAll("input[type='password']"));
    if (passwords.length < 2) return null;

    const index = passwords.indexOf(field);
    if (index > 0) return passwords[index - 1];
    return passwords.find((candidate) => candidate !== field) || null;
  }

  function validateCommonRules(field) {
    const value = String(field.value || "").trim();
    const label = getLabel(field);
    const key = fieldKey(field);
    const type = lower(field.type);
    const validation = lower(field.dataset.validation);

    if (field.type === "checkbox") {
      if (field.required && !field.checked) return invalid(`${label} est obligatoire.`);
      return valid();
    }

    if (field.required && isEmpty(field)) {
      return invalid(`${label} est obligatoire.`);
    }

    if (optionalEmpty(field)) {
      return { valid: true, optional: true };
    }

    if (validation.includes("identifier")) {
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      const isCin = /^\d{8}$/.test(value);
      const isPhone = /^\d{8,15}$/.test(value);

      if (!isEmail && !isCin && !isPhone) {
        return invalid("Entrez un email valide, un CIN a 8 chiffres ou un telephone valide.");
      }
    }

    if (!validation.includes("identifier") && (type === "email" || key.includes("email") || key.includes("mail"))) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return invalid("Entrez une adresse email valide avec @ et un domaine.");
      }
    }

    if (key.includes("cin")) {
      if (!/^\d{8}$/.test(value)) {
        return invalid("Le CIN doit contenir exactement 8 chiffres.");
      }
    }

    if (key.includes("telephone") || key.includes("phone") || key.includes("tel")) {
      if (!/^\d{8,15}$/.test(value)) {
        return invalid("Le numero de telephone doit contenir entre 8 et 15 chiffres.");
      }
    }

    if (key.includes("code_postal")) {
      if (!/^\d{4}$/.test(value)) {
        return invalid("Le code postal doit contenir exactement 4 chiffres.");
      }
    }

    if (key.includes("verification_code") || key.includes("code_reinitialisation")) {
      if (!/^\d{6}$/.test(value)) {
        return invalid("Le code doit contenir exactement 6 chiffres.");
      }
    }

    if (field.pattern && !patternMatches(field.pattern, value)) {
      return invalid("Le format saisi n'est pas valide.");
    }

    if (type === "password" || key.includes("mot_de_passe") || key.includes("password")) {
      const min = minLength(field, 6);
      if (min > 0 && field.value.length < min) {
        return invalid(`Le mot de passe doit contenir au moins ${min} caracteres.`);
      }
    }

    if (key.includes("confirm") || key.includes("confirmer") || key.includes("confirmation")) {
      const match = findMatchField(field);
      if (match && field.value !== match.value) {
        return invalid("Les mots de passe ne correspondent pas.");
      }
    }

    const min = minLength(field, 0);
    if (min > 0 && value.length < min) {
      return invalid(`${label} doit contenir au moins ${min} caracteres.`);
    }

    const max = maxLength(field);
    if (max > 0 && value.length > max) {
      return invalid(`${label} ne doit pas depasser ${max} caracteres.`);
    }

    if (type === "number" || key.includes("latitude") || key.includes("longitude")) {
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) {
        return invalid(`${label} doit etre numerique.`);
      }

      if (field.min !== "" && numeric < Number(field.min)) {
        return invalid(`${label} doit etre superieur ou egal a ${field.min}.`);
      }

      if (field.max !== "" && numeric > Number(field.max)) {
        return invalid(`${label} doit etre inferieur ou egal a ${field.max}.`);
      }

      if (field.step === "1" && !Number.isInteger(numeric)) {
        return invalid(`${label} doit etre un nombre entier.`);
      }
    }

    if (key.includes("latitude")) {
      const latitude = Number(value);
      if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
        return invalid("La latitude doit etre comprise entre -90 et 90.");
      }
    }

    if (key.includes("longitude")) {
      const longitude = Number(value);
      if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
        return invalid("La longitude doit etre comprise entre -180 et 180.");
      }
    }

    if (key.includes("date_naissance") && value) {
      const selected = new Date(`${value}T00:00:00`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (Number.isNaN(selected.getTime()) || selected > today) {
        return invalid("La date de naissance ne peut pas etre dans le futur.");
      }
    }

    if (key.includes("description") && field.required && value.length < 10) {
      return invalid("La description doit contenir au moins 10 caracteres.");
    }

    if (type === "file" && field.files && field.files.length && field.accept) {
      const accepted = field.accept.split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
      const file = field.files[0];
      const ext = `.${lower(file.name).split(".").pop()}`;
      const mime = lower(file.type);
      const ok = accepted.some((item) => {
        if (item.endsWith("/*")) return mime.startsWith(item.slice(0, -1));
        return item === ext || item === mime;
      });
      if (!ok) return invalid("Le format du fichier n'est pas autorise.");
    }

    return valid();
  }

  function validateCrossFieldRules(field) {
    if (!field.form) return valid();

    const key = fieldKey(field);
    const pairs = [
      ["fromCity", "toCity", "Le depart et la destination doivent etre differents."],
      ["routeDeparture", "routeArrival", "La station de depart et la station arrivee doivent etre differentes."]
    ];

    for (const [firstId, secondId, message] of pairs) {
      if (!key.includes(lower(firstId)) && !key.includes(lower(secondId))) continue;

      const first = field.form.querySelector(`#${CSS.escape(firstId)}`);
      const second = field.form.querySelector(`#${CSS.escape(secondId)}`);
      if (first && second && first.value && second.value && first.value === second.value) {
        return invalid(message);
      }
    }

    return valid();
  }

  function validateField(field, options) {
    const settings = Object.assign({ force: false, mark: true }, options || {});
    if (isSkippable(field)) return true;

    const common = validateCommonRules(field);
    const result = common.valid ? validateCrossFieldRules(field) : common;
    const shouldShow = settings.force || field.classList.contains(VALIDATED_CLASS);

    if (settings.mark) {
      if (common.optional && !settings.force) {
        setFieldState(field, "", "", false);
      } else if (result.valid) {
        const showValid = shouldShow && hasRule(field) && !common.optional;
        setFieldState(field, showValid ? "valid" : "", showValid ? result.message : "", settings.force);
      } else {
        setFieldState(field, "invalid", result.message, true);
      }
    }

    return result.valid;
  }

  function validateRelatedFields(field) {
    if (!field.form) return;

    const related = Array.from(field.form.querySelectorAll("input[type='password'], #fromCity, #toCity, #routeDeparture, #routeArrival"));
    related.forEach((candidate) => {
      if (candidate !== field && candidate.classList.contains(VALIDATED_CLASS)) {
        validateField(candidate, { force: true });
      }
    });
  }

  function fieldsIn(form) {
    return Array.from(form.querySelectorAll(FIELD_SELECTOR)).filter((field) => !isSkippable(field));
  }

  function validateForm(form, options) {
    const settings = Object.assign({ focus: true, force: true }, options || {});
    let firstInvalid = null;

    fieldsIn(form).forEach((field) => {
      const isValid = validateField(field, { force: settings.force });
      if (!isValid && !firstInvalid) firstInvalid = field;
    });

    if (firstInvalid && settings.focus) {
      firstInvalid.focus({ preventScroll: true });
      firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    return !firstInvalid;
  }

  function clearForm(form) {
    fieldsIn(form).forEach((field) => {
      field.classList.remove(VALIDATED_CLASS, "is-valid", "is-invalid", "invalid");
      field.removeAttribute("aria-invalid");
      setFeedback(field, "", "");
    });
  }

  function bindField(field) {
    if (field.dataset.cpValidationBound === "1" || isSkippable(field)) return;
    field.dataset.cpValidationBound = "1";

    const handler = () => {
      field.classList.add(VALIDATED_CLASS);
      validateField(field, { force: true });
      validateRelatedFields(field);
    };

    field.addEventListener("input", handler);
    field.addEventListener("change", handler);
    field.addEventListener("blur", handler);
  }

  function bindForm(form) {
    if (!form || form.dataset.cpValidationBound === "1") return;
    form.dataset.cpValidationBound = "1";
    form.setAttribute("novalidate", "novalidate");

    fieldsIn(form).forEach(bindField);

    form.addEventListener("submit", (event) => {
      if (!validateForm(form, { focus: true, force: true })) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    }, true);

    form.addEventListener("reset", () => {
      window.setTimeout(() => clearForm(form), 0);
    });
  }

  function init(root) {
    const scope = root || document;
    scope.querySelectorAll("form").forEach(bindForm);
  }

  window.CivicPlusValidation = {
    init,
    validateField,
    validateForm,
    clearForm
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => init(document));
  } else {
    init(document);
  }
})();
