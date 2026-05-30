import mongoose from 'mongoose';

export type EventSignupModelType = {
  created: string;
  email?: string;
  eventId: number;
  first_name: string;
  gdpr_consent: boolean;
  id: string;
  last_name: string;
  orgId: number;
  person_id?: number;
  phone?: string;
};

const eventSignupSchema = new mongoose.Schema<EventSignupModelType>({
  created: { default: () => new Date().toISOString(), type: String },
  email: String,
  eventId: { required: true, type: Number },
  first_name: { required: true, type: String },
  gdpr_consent: { required: true, type: Boolean },
  last_name: { required: true, type: String },
  orgId: { required: true, type: Number },
  phone: String,
});

export const EventSignupModel: mongoose.Model<EventSignupModelType> =
  mongoose.models.EventSignup ||
  mongoose.model<EventSignupModelType>('EventSignup', eventSignupSchema);

export type EventAutoReminderModelType = {
  eventId: number;
  hoursBeforeEvent: number;
  orgId: number;
  sendAt: string;
  sent: boolean;
  tokenData: {
    access_token: string;
    expires_in: number;
    refresh_token: string;
    token_type: string;
  };
};

const eventAutoReminderSchema = new mongoose.Schema<EventAutoReminderModelType>(
  {
    eventId: { required: true, type: Number },
    hoursBeforeEvent: { required: true, type: Number },
    orgId: { required: true, type: Number },
    sendAt: { required: true, type: String },
    sent: { default: false, type: Boolean },
    tokenData: {
      required: true,
      type: {
        access_token: String,
        expires_in: Number,
        refresh_token: String,
        token_type: String,
      },
    },
  }
);

eventAutoReminderSchema.index({ eventId: 1, orgId: 1 }, { unique: true });

export const EventAutoReminderModel: mongoose.Model<EventAutoReminderModelType> =
  mongoose.models.EventAutoReminder ||
  mongoose.model<EventAutoReminderModelType>(
    'EventAutoReminder',
    eventAutoReminderSchema
  );
