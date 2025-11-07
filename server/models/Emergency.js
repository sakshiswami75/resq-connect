const mongoose = require('mongoose');

const emergencySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // ← CHANGED: Make optional for anonymous quick reports
    },
    emergencyType: {
      type: String,
      required: [true, 'Please specify emergency type'],
      enum: [
        'Medical Emergency',
        'Accident',
        'Flood',
        'Fire',
        'Building Collapse',
        'Elderly Assistance',
        'Other',
      ],
    },
    description: {
      type: String,
      required: false, // ← CHANGED: Make optional for quick reports
      maxlength: [500, 'Description cannot be more than 500 characters'],
      default: '', // ← ADDED: Default empty string
    },
    urgency: {
      type: String,
      required: true,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
      address: String,
    },
    contactNumber: {
      type: String,
    },
    status: {
      type: String,
      enum: ['pending', 'assigned', 'in-progress', 'resolved', 'cancelled'],
      default: 'pending',
    },
    assignedVolunteers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isQuickReport: {
      type: Boolean,
      default: false, // ← ADDED: Track if it's an anonymous quick report
    },
    aiClassification: {
      category: String,
      confidence: Number,
      suggestedResources: [String],
    },
    responseTime: {
      type: Number, // in minutes
    },
    resolvedAt: {
      type: Date,
    },
    notes: [
      {
        text: String,
        addedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Create geospatial index for location-based queries
emergencySchema.index({ location: '2dsphere' });
emergencySchema.index({ status: 1 });
emergencySchema.index({ urgency: 1 });
emergencySchema.index({ isQuickReport: 1 }); // ← ADDED: Index for quick reports

module.exports = mongoose.model('Emergency', emergencySchema);