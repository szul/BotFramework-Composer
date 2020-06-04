// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import { importResolverGenerator } from '@bfc/shared';
import { lgIndexer } from '@bfc/indexers';

import * as lgUtil from '../../../utils/lgUtil';
import {
  LgActionType,
  LgParsePayload,
  LgUpdateTemplatePayload,
  LgCreateTemplatePayload,
  LgRemoveTemplatePayload,
  LgRemoveAllTemplatesPayload,
  LgCopyTemplatePayload,
} from '../types';

const ctx: Worker = self as any;

interface ParseMessage {
  id: string;
  type: LgActionType.Parse;
  payload: LgParsePayload;
}

interface AddMessage {
  id: string;
  type: LgActionType.AddTemplate;
  payload: LgCreateTemplatePayload;
}

interface UpdateMessage {
  id: string;
  type: LgActionType.UpdateTemplate;
  payload: LgUpdateTemplatePayload;
}

interface RemoveMessage {
  id: string;
  type: LgActionType.RemoveTemplate;
  payload: LgRemoveTemplatePayload;
}

interface RemoveAllMessage {
  id: string;
  type: LgActionType.RemoveAllTemplates;
  payload: LgRemoveAllTemplatesPayload;
}

interface CopyMessage {
  id: string;
  type: LgActionType.CopyTemplate;
  payload: LgCopyTemplatePayload;
}

type LgMessageEvent = ParseMessage | AddMessage | UpdateMessage | RemoveMessage | RemoveAllMessage | CopyMessage;

ctx.onmessage = function (event) {
  const msg = event.data as LgMessageEvent;
  const id = msg.id;

  switch (msg.type) {
    case LgActionType.Parse: {
      const { targetId, content, lgFiles } = msg.payload;
      const { parse } = lgIndexer;

      return new Promise((resolve) => {
        try {
          const lgImportResolver = importResolverGenerator(lgFiles, '.lg');

          const { templates, diagnostics } = parse(content, targetId, lgImportResolver);

          ctx.postMessage({ id, payload: { id: targetId, content, templates, diagnostics } });
        } catch (error) {
          ctx.postMessage({ id, error });
        }
        resolve();
      });
      break;
    }
    case LgActionType.AddTemplate: {
      const { content, template } = msg.payload;
      const payload = lgUtil.addTemplate(content, template);

      ctx.postMessage({ id, payload });
      break;
    }
    case LgActionType.UpdateTemplate: {
      const { content, templateName, template } = msg.payload;
      const payload = lgUtil.updateTemplate(content, templateName, template);

      ctx.postMessage({ id, payload });
      break;
    }
    case LgActionType.RemoveTemplate: {
      const { content, templateName } = msg.payload;
      const payload = lgUtil.removeTemplate(content, templateName);
      ctx.postMessage({ id: payload });
      break;
    }
    case LgActionType.RemoveAllTemplates: {
      const { content, templateNames } = msg.payload;
      const payload = lgUtil.removeTemplates(content, templateNames);
      ctx.postMessage({ id, payload });
      break;
    }
    case LgActionType.CopyTemplate: {
      const { content, toTemplateName, fromTemplateName } = msg.payload;
      const payload = lgUtil.copyTemplate(content, fromTemplateName, toTemplateName);
      ctx.postMessage({ id, payload });
      break;
    }
  }
};
