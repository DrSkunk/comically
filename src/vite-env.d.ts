/// <reference types="vite/client" />

// Google APIs type declarations
declare global {
  interface Window {
    google: {
      picker: {
        PickerBuilder: new () => GooglePickerBuilder;
        ViewId: {
          FOLDERS: string;
        };
        Response: {
          ACTION: string;
          DOCUMENTS: string;
        };
        Action: {
          PICKED: string;
          CANCEL: string;
        };
        Document: {
          ID: string;
          NAME: string;
        };
      };
    };
    gapi: {
      load: (api: string, callback: () => void) => void;
    };
  }

  interface GooglePickerBuilder {
    addView: (view: string) => GooglePickerBuilder;
    setOAuthToken: (token: string) => GooglePickerBuilder;
    setDeveloperKey: (key: string) => GooglePickerBuilder;
    setCallback: (
      callback: (data: Record<string, unknown>) => void
    ) => GooglePickerBuilder;
    build: () => GooglePicker;
  }

  interface GooglePicker {
    setVisible: (visible: boolean) => void;
  }
}

export {};
