import mongoose from "mongoose";
const { Schema, Types } = mongoose;

const CourseSchema = new Schema({
  nombre: {
    type: String,
    required: true,
  },
  prerequisitos: [
    {
      type: Types.ObjectId,
      ref: "Course",
      required: true,
      default: [],
    },
  ],
});

export const CourseModel = mongoose.model("Course", CourseSchema);

// Register the Tag schema and model so that mongoose knows about "Tag"
const TagSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: false,
  }
);

// Only register if not already registered (prevents OverwriteModelError in Lambda)
export const TagModel = mongoose.model("Tag", TagSchema);

// This is the embedded tag reference used in Career
const EmbeddedTagSchema = new Schema(
  {
    tag: {
      type: Types.ObjectId,
      ref: "Tag",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
  },
  {
    _id: true,
    timestamps: false,
  }
);

const CareerSchema = new Schema(
  {
    nombre_carrera: {
      type: String,
      required: true,
    },
    facultad: {
      type: String,
      required: true,
    },
    descripcion: {
      type: String,
      required: true,
    },
    duracion: {
      type: Number,
      required: true,
    },
    empleabilidad: {
      type: String,
      required: true,
      enum: ["baja", "media", "alta"],
    },
    areas_de_desarrollo_potencial: [
      {
        area: {
          type: String,
          required: true,
        },
        descripcion: {
          type: String,
          required: true,
        },
      },
    ],
    plan_de_estudio: {
      año_1: {
        primer_semestre: [
          {
            type: Types.ObjectId,
            ref: "Course",
          },
        ],
        segundo_semestre: [
          {
            type: Types.ObjectId,
            ref: "Course",
          },
        ],
      },
      año_2: {
        primer_semestre: [
          {
            type: Types.ObjectId,
            ref: "Course",
          },
        ],
        segundo_semestre: [
          {
            type: Types.ObjectId,
            ref: "Course",
          },
        ],
      },
      año_3: {
        primer_semestre: [
          {
            type: Types.ObjectId,
            ref: "Course",
          },
        ],
        segundo_semestre: [
          {
            type: Types.ObjectId,
            ref: "Course",
          },
        ],
      },
      año_4: {
        primer_semestre: [
          {
            type: Types.ObjectId,
            ref: "Course",
          },
        ],
        segundo_semestre: [
          {
            type: Types.ObjectId,
            ref: "Course",
          },
        ],
      },
      año_5: {
        primer_semestre: [
          {
            type: Types.ObjectId,
            ref: "Course",
          },
        ],
        segundo_semestre: [
          {
            type: Types.ObjectId,
            ref: "Course",
          },
        ],
      },
    },
    areas_de_formacion: [
      {
        area: {
          type: String,
          required: true,
        },
        descripcion: {
          type: String,
          default: "",
        },
      },
    ],
    perfil_del_egresado: {
      type: String,
      required: true,
    },
    competencias_desarrolladas: [
      {
        type: String,
      },
    ],
    salario_minimo: {
      type: Number,
      required: true,
    },
    salario_maximo: {
      type: Number,
      required: true,
    },
    moneda_salario: {
      type: String,
      required: true,
      default: "USD",
    },
    tags: [EmbeddedTagSchema],
  },
  {
    timestamps: true,
  }
);

export const CareerModel = mongoose.model("Career", CareerSchema);
