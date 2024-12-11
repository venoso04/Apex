import Joi from "joi";

export const uploadImageSchema = Joi.object({
  category: Joi.string().valid("cars", "competitions", "events", "teams", "subTeams").required(),
  title: Joi.string().required(),
  description: Joi.string().allow(""),
  team: Joi.string().valid("Operation", "Shell", "Formula", "Ever").allow(null),
  subTeam: Joi.string().valid(
    "Vehicle Dynamics",
    "Frame",
    "Power Train",
    "Drive Line",
    "Electrical",
    "Embedded Systems",
    "Autonomous",
    "Cost and Manufacturing",
    "Media And Marketing",
    "Business Plan",
    "External Relations",
    "CS"
  ).allow(null),
  priority: Joi.number().default(0),
  isHighlighted: Joi.boolean().default(false),
  landingPageVisibility: Joi.boolean().default(false),
  gallerySectionVisibility: Joi.boolean().default(true),
});

export const updateImageSchema = Joi.object({
  title: Joi.string(),
  id: Joi.string().required(),
  description: Joi.string().allow(""),
  category: Joi.string().valid("cars", "competitions", "events", "teams", "subTeams"),
  team: Joi.string().valid("Operation", "Shell", "Formula", "Ever").allow(null),
  subTeam: Joi.string()
    .valid(
      "Vehicle Dynamics",
      "Frame",
      "Power Train",
      "Drive Line",
      "Electrical",
      "Embedded Systems",
      "Autonomous",
      "Cost and Manufacturing",
      "Media And Marketing",
      "Business Plan",
      "External Relations",
      "CS"
    )
    .allow(null),
  priority: Joi.number(),
  isHighlighted: Joi.boolean(),
  landingPageVisibility: Joi.boolean(),
  gallerySectionVisibility: Joi.boolean(),
}).min(1);


export const fetchGalleryItemsSchema = Joi.object({
  category: Joi.string().valid("cars", "competitions", "events", "teams", "subTeams"),
  team: Joi.string().valid("Operation", "Shell", "Formula", "Ever"),
  subTeam: Joi.string()
    .valid(
      "Vehicle Dynamics",
      "Frame",
      "Power Train",
      "Drive Line",
      "Electrical",
      "Embedded Systems",
      "Autonomous",
      "Cost and Manufacturing",
      "Media And Marketing",
      "Business Plan",
      "External Relations",
      "CS"
    ),
  isHighlighted: Joi.boolean(),
  landingPageVisibility: Joi.boolean(),
  gallerySectionVisibility: Joi.boolean(),
  priority: Joi.number(),
  priorityThreshold: Joi.number().integer(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).default(10),
});


export const deleteImageSchema = Joi.object({
  id: Joi.string().required(),
});
