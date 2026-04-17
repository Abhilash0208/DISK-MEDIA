const Joi = require('joi')

const validate = (schema, target = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[target], {
    abortEarly:      false,
    stripUnknown:    true,
    allowUnknown:    false
  })
  if (error) {
    const details = error.details.map(d => d.message.replace(/['"]/g, ''))
    return res.status(422).json({ message: 'Validation error', errors: details })
  }
  req[target] = value
  next()
}

// ── Schemas ────────────────────────────────────────────────────────────────────
const schemas = {
  register: Joi.object({
    name:      Joi.string().min(2).max(80).required(),
    email:     Joi.string().email().required(),
    password:  Joi.string().min(8).max(72).required(),
    interests: Joi.array().items(Joi.string()).min(1).default([]),
    language:  Joi.string().default('en')
  }),

  login: Joi.object({
    email:    Joi.string().email().required(),
    password: Joi.string().required()
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().required()
  }),

  resetPassword: Joi.object({
    token:    Joi.string().required(),
    password: Joi.string().min(8).max(72).required()
  }),

  createContent: Joi.object({
    type:        Joi.string().valid('article','video','podcast','live').required(),
    title:       Joi.string().min(5).max(200).required(),
    category:    Joi.string().required(),
    tags:        Joi.array().items(Joi.string()).default([]),
    body:        Joi.string().allow('', null),
    excerpt:     Joi.string().max(300).allow('', null),
    isPremium:   Joi.boolean().default(false),
    language:    Joi.string().default('en'),
    status:      Joi.string().valid('draft','published','breaking').default('draft'),
    streamUrl:   Joi.string().uri().allow('', null),
    scheduledAt: Joi.date().allow(null)
  }),

  updateContent: Joi.object({
    title:       Joi.string().min(5).max(200),
    category:    Joi.string(),
    tags:        Joi.array().items(Joi.string()),
    body:        Joi.string().allow('', null),
    excerpt:     Joi.string().max(300).allow('', null),
    isPremium:   Joi.boolean(),
    language:    Joi.string(),
    status:      Joi.string().valid('draft','published','breaking','archived'),
    streamUrl:   Joi.string().uri().allow('', null),
    scheduledAt: Joi.date().allow(null)
  }),

  logBehavior: Joi.object({
    contentId:      Joi.string().required(),
    event:          Joi.string().valid('view','read','listen','watch','skip','save','share','like','unlike','unsave').required(),
    duration:       Joi.number().min(0).default(0),
    completionRate: Joi.number().min(0).max(1).default(0)
  }),

  updateProfile: Joi.object({
    name:      Joi.string().min(2).max(80),
    bio:       Joi.string().max(300).allow('', null),
    website:   Joi.string().uri().allow('', null),
    language:  Joi.string(),
    location:  Joi.string().allow('', null),
    interests: Joi.array().items(Joi.string()),
    notifPreferences: Joi.object({
      breaking: Joi.boolean(),
      live:     Joi.boolean(),
      weekly:   Joi.boolean()
    })
  })
}

module.exports = { validate, schemas }
