import { Router } from './router.js'
import { MakeSave } from './generator.js'

const router = new Router();
router.cors();

function ValidateArr(field, requiredLen)
{
    if(!field || field.length != requiredLen)
      return false;
    
    for(var i = 0; i < requiredLen; i++)
    {
      if(!ValidateInt(field[i]))
      {
        return false;
      }
    }
    return true;
}

function ValidateInt(field)
{
  return typeof field === 'number' && Number.isInteger(field);
}

function ValidateString(field) {
  return field && typeof field === 'string';
}

function generateGUID() {
  function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
          .toString(16)
          .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + '4' + s4().substring(0, 3) + '-' + s4() + '-' + s4() + s4() + s4();
}

async function checkturnstile(request)
{
  const body = await request.json();
  const token = body.turnstile;
  const ip = request.headers.get('CF-Connecting-IP');

  let formData = new FormData();

  formData.append('secret', ''); // your turnstile secret
  formData.append('response', token);
  formData.append('remoteip', ip);

  const url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
  const result = await fetch(url, {
      body: formData,
      method: 'POST',
  });

  const outcome = await result.json();
  return outcome;
}

async function NotifyUsed(username, ip)
{
  // webhook notify
}

router.post('/gen/', async ({env, req}) => {
  if(!checkturnstile(req)) {
    return Response.json({ "code": -1, "detail": "No valid captcha passed"});
  }
  let body = null;
  try {
    body = await req.json();
  } catch (error) {
    return Response.json({ "code": -1, "detail": "No valid body specified"});
  }
  if(!ValidateInt(body.totalplaytime) || !ValidateInt(body.damagetaken) || !ValidateInt(body.stepstaken)
    || !ValidateInt(body.crystalsbroken) || !ValidateInt(body.killersstunned) || !ValidateInt(body.totaldeaths)
    || !ValidateInt(body.totalpurchase) || !ValidateInt(body.roundswon) || !ValidateInt(body.totalenkephalin)
    || !ValidateString(body.playername)
    || !ValidateArr(body.HasBeenToMap, 45) || !ValidateArr(body.bossUnlocked, 4)
    || !ValidateArr(body.HasEncounteredAlt, 36) || !ValidateArr(body.HasEncountered, 89)
    || !ValidateArr(body.Achievements, 128) || !ValidateArr(body.HasSurvivedBoss, 4)
    || !ValidateArr(body.HasSurvivedAlt, 35) || !ValidateArr(body.HasSurvived, 89)) {
      return Response.json({ "code": -1, "detail": "No valid parameters provided"});
  }

  const last_gen_info_text = await env.DB.get(body.playername);
  if(last_gen_info_text)
  {
    var last_gen_info = JSON.parse(last_gen_info_text);
    last_gen_info.last_seen = Date.now();
    await env.DB.put(body.playername, JSON.stringify(last_gen_info));
    return Response.json({"code": 0, "generated": last_gen_info.last_generated }, { status:200 });
  }

  const generated = MakeSave(body.playername, body);
  var gen_info = {
    gen_time: Date.now(),
    last_generated: generated,
    last_seen: Date.now(),
    ip: req.headers.get('CF-Connecting-IP')
  };

  await env.DB.put(body.playername, JSON.stringify(gen_info));
  await NotifyUsed(body.playername, gen_info.ip);

  return Response.json({"code": 0, "generated": generated }, { status:200 });
})

import HTML from "./_index.html";
router.get('/', ({env, req}) => {
  return new Response(HTML, {
    headers: { "Content-Type": "text/html" }
  });
})

export default {
  async fetch(request, env, ctx) {
    return router.handle(request, env, ctx)
  }
}
