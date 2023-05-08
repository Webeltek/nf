import logging
from urllib.parse import parse_qs
from urllib.parse import splitquery

from flask import Blueprint
from flask import current_app
from flask import redirect
from flask import render_template, jsonify
from flask import request
from flask import session, jsonify
from flask.helpers import make_response
from flask.helpers import send_from_directory
import werkzeug

from oidcrp import rp_handler
from oidcrp.exception import OidcServiceError
from ..models_al import *
from ..auth_bp.views import reg_admin_confirm, login_form

from ..email import send_email, send_adm_conf_email
import requests
from .. import cache
import datetime

logger = logging.getLogger(__name__)
logger.disabled = True

oidc_rp_views = Blueprint('oidc_rp', __name__, url_prefix='')


def compact(qsdict):
    res = {}
    for key, val in qsdict.items():
        if len(val) == 1:
            res[key] = val[0]
        else:
            res[key] = val
    return res


@oidc_rp_views.route('/api/vipps/static/<path:path>')
def send_js(path):
    return send_from_directory('static', path)


@oidc_rp_views.route('/api/vipps/rp_landing')
def index():
    _providers = current_app.rp_config.clients.keys()
    return render_template('opbyuid.html', providers=_providers)

@oidc_rp_views.route('/api/test', methods=['GET','POST'])
def oidctest():
    test_usr = request.json['test_usr']
    headers = {
        "Content-Type": "application/json"
    }
    data = {
        "test_usr": test_usr
    }
    return jsonify({"test_usr":test_usr})   


@oidc_rp_views.route('/api/vipps/get_merch_tkn',methods=['GET','POST'])
def get_merch_tkn():
    headers = {
      "client_id" : "c16aebf0-d913-4b39-bfa8-0ae2a91f8b90",
      "client_secret" : "SUW5CCh56jRWbeh6GZChzLVFusM=",
      "Ocp-Apim-Subscription-Key": "a34e0edb11b5407395097294036eb625",
    }
    url = 'https://apitest.vipps.no/accessToken/get'
    data = ''
    response = requests.post(url, headers=headers,json=data)
    return make_response(response.json())

@oidc_rp_views.route('/api/vipps/send_payment',methods=['GET','POST'])
def send_payment():
    access_tkn = request.args.get('access_tkn')
    usr_phone = request.args.get('usr_phone')
    amount = request.args.get('amount')
    idemp_key = request.args.get('idemp_key')
    msn = "298345"
    url= 'https://apitest.vipps.no/epayment/v1/payments'
    timest = str(datetime.datetime.timestamp())
    reference = msn + timest
    headers = {
        "Authorization": f"Bearer {access_tkn}" ,
        "Ocp-Apim-Subscription-Key": "a34e0edb11b5407395097294036eb625" ,
        "Content-Type": "application/json" ,
        "Idempotency-Key": idemp_key ,
        "Merchant-Serial-Number": msn 
    }
    data={
        "amount": {
          "currency": "NOK",
          "value": amount
        },
        "paymentMethod": {
          "type": "WALLET"
        },
        "customer": {
          "phoneNumber": usr_phone  
        },
        "reference": reference,
        "returnUrl": "https://webeltek.org/vipps_checkout"+f"?reference={reference}",
        "userFlow": "WEB_REDIRECT",
        "paymentDescription": "A simple payment"
        }
    response = requests.post(url, headers=headers,json=data)
    print(f'/api/vipps/send_payment response: {response.json()}')
    return make_response(response.json())       

@oidc_rp_views.route('/api/vipps/rp',methods=['GET','POST'])
def rp():
    print('inside /api/vipps/rp')
    iss = "https://apitest.vipps.no/access-management-1.0/access/"
    uid = "c16aebf0-d913-4b39-bfa8-0ae2a91f8b90"
    is_checkout = request.args['is_checkout']
    cache.set('is_checkout',is_checkout)
    if not iss:
        iss = request.args['static_iss']
    print(f'inside /api/vipps/rp iss: {iss}') 
    if not iss:
        uid = request.args['uid']
    else:
        uid = ''

    if iss or uid:
        print('oidc_rp inside iss or uid')
        args = {
            'req_args': {
                "claims": {"id_token": {"acr": {"value": "https://refeds.org/profile/mfa"}}}
            }
        }

        if uid:
            args['user_id'] = uid

        session['op_identifier'] = iss
        try:
            result = current_app.rph.begin(iss, **args)
        except Exception as err:
            return make_response('Something went wrong:{}'.format(err), 400)
        else:
            response = redirect(f"{result['url']}", 303)
            return response
    else:
        _providers = current_app.rp_config.clients.keys()
        return render_template('opbyuid.html', providers=_providers)


def get_rp(op_identifier):
    try:
        _iss = current_app.rph.hash2issuer[op_identifier]
    except KeyError:
        try:
            rp = current_app.rph.issuer2rp[op_identifier]
        except KeyError:
            logger.error('Unkown issuer: {} not among {}'.format(
                op_identifier, list(current_app.rph.hash2issuer.keys())))
            return make_response(f"Unknown OP identifier: {op_identifier}", 400)
    else:
        try:
            rp = current_app.rph.issuer2rp[_iss]
        except KeyError:
            return make_response(f"Couldn't find client for issuer: '{_iss}'", 400)

    return rp


def finalize(op_identifier, request_args):
    rp = get_rp(op_identifier)

    if hasattr(rp, 'status_code') and rp.status_code != 200:
        logger.error(rp.response[0].decode())
        return rp.response[0], rp.status_code

    _context = rp.client_get("service_context")
    session['client_id'] = _context.get('client_id')

    session['state'] = request_args.get('state')

    if session['state']:
        try:
            iss = _context.state.get_iss(session['state'])
        except KeyError as keyErr:
            logger.error('error in StateInterface: get the state connected to key from state database')    
    else:
        return make_response('Unknown state', 400)

    session['session_state'] = request_args.get('session_state', '')

    logger.debug('Issuer: {}'.format(iss))

    try:
        res = current_app.rph.finalize(iss, request_args)
    except OidcServiceError as excp:
        # replay attack prevention, is that code was already used before
        return excp.__str__(), 403
    except Exception as excp:
        raise excp

    if 'userinfo' in res:
        _context = rp.client_get("service_context")
        endpoints = {}
        for k, v in _context.provider_info.items():
            if k.endswith('_endpoint'):
                endp = k.replace('_', ' ')
                endp = endp.capitalize()
                endpoints[endp] = v

        kwargs = {}

        # Do I support session status checking ?
        _status_check_info = _context.add_on.get('status_check')
        if _status_check_info:
            # Does the OP support session status checking ?
            _chk_iframe = _context.get('provider_info').get('check_session_iframe')
            if _chk_iframe:
                kwargs['check_session_iframe'] = _chk_iframe
                kwargs["status_check_iframe"] = _status_check_info['rp_iframe_path']

        # Where to go if the user clicks on logout
        kwargs['logout_url'] = "{}/logout".format(_context.base_url)
        usr_email = res['userinfo']['email']
        usr_sub = res['userinfo']['sub']
        usr_email_ver = res['userinfo']['email_verified']
        usr_access_tkn = res['token']
        usr_phone = res['userinfo']['phone_number']
        is_checkout= cache.get('is_checkout')
        if is_checkout:
            return redirect(f'https://webeltek.org/vipps_checkout?access_token={usr_access_tkn}&usr_phone={usr_phone}')
        elif is_checkout is False: 
            return redirect(f'https://webeltek.org/login?username={usr_email}&vipps_sub={usr_sub}')
    else:
        return make_response(res['error'], 400)   
        
""" def vipps_usr_adm_confirm(usr_email=None,temp_usr_id=None):
    if (usr_email and temp_usr_id) is not None:
        users_db.connect(reuse_if_open=True)
        msg=''
        adm_conf_token = User.generate_admin_conf_token(temp_usr_id)
        temp_user = User.select().where(User.id==temp_usr_id).first()
        app= current_app._get_current_object()
        adm_conf_email = app.config['FLASKY_CONF_ADMIN']
        send_adm_conf_email(adm_conf_email, 'Confirm registration of account: '+temp_user.user_email,  \
                             'auth/email/reg_admin_confirm', user=temp_user, adm_conf_token=adm_conf_token)
        msg = 'En bekreftelses e-post har blitt sendt til admin på e-post.'
        users_db.close() """

def get_op_identifier_by_cb_uri(url: str):
    uri = splitquery(url)[0]
    print(f'get_op_identifier_by_cb_uri   uri: {uri}')
    for k, v in current_app.rph.issuer2rp.items():
        print(f'get_op_identifier_by_cb_uri key :{k}')
        _cntx = v.get_service_context()
        for endpoint in ("redirect_uris",
                         "post_logout_redirect_uris",
                         "frontchannel_logout_uri",
                         "backchannel_logout_uri"):
            if uri in _cntx.get(endpoint, []):
                return k


@oidc_rp_views.route('/api/vipps/authz_cb/<op_identifier>',methods=["GET","POST"])
def authz_cb(op_identifier):
    op_identifier = get_op_identifier_by_cb_uri(request.url)
    print(f'authz_cb op_identifier: {op_identifier}')
    return finalize(op_identifier, request.args)


@oidc_rp_views.errorhandler(werkzeug.exceptions.BadRequest)
def handle_bad_request(e):
    return 'bad request!', 400


@oidc_rp_views.route('/api/vipps/repost_fragment')
def repost_fragment():
    args = compact(parse_qs(request.args['url_fragment']))
    op_identifier = request.args['op_identifier']
    return finalize(op_identifier, args)


@oidc_rp_views.route('/api/vipps/authz_im_cb')
def authz_im_cb(op_identifier='', **kwargs):
    logger.debug('implicit_hybrid_flow kwargs: {}'.format(kwargs))
    return render_template('repost_fragment.html', op_identifier=op_identifier)


@oidc_rp_views.route('/api/vipps/session_iframe')
def session_iframe():  # session management
    logger.debug('session_iframe request_args: {}'.format(request.args))

    _rp = get_rp(session['op_identifier'])
    _context = _rp.client_get("service_context")
    session_change_url = "{}/session_change".format(_context.base_url)

    _issuer = current_app.rph.hash2issuer[session['op_identifier']]
    args = {
        'client_id': session['client_id'],
        'session_state': session['session_state'],
        'issuer': _issuer,
        'session_change_url': session_change_url
    }
    logger.debug('rp_iframe args: {}'.format(args))
    _template = _context.add_on["status_check"]["session_iframe_template_file"]
    return render_template(_template, **args)


@oidc_rp_views.route('/api/vipps/session_change')
def session_change():
    logger.debug('session_change: {}'.format(session['op_identifier']))
    _rp = get_rp(session['op_identifier'])

    # If there is an ID token send it along as a id_token_hint
    _aserv = _rp.client_get("service", 'authorization')
    request_args = {"prompt": "none"}

    request_args = _aserv.multiple_extend_request_args(
        request_args, session['state'], ['id_token'],
        ['auth_response', 'token_response', 'refresh_token_response'])

    logger.debug('session_change:request_args {}'.format(request_args))

    _info = current_app.rph.init_authorization(_rp, request_args=request_args)
    logger.debug('session_change:authorization request: {}'.format(_info['url']))
    return redirect(_info['url'], 303)


# post_logout_redirect_uri
@oidc_rp_views.route('/api/vipps/session_logout/<op_identifier>')
def session_logout(op_identifier):
    op_identifier = get_op_identifier_by_cb_uri(request.url)
    _rp = get_rp(op_identifier)
    logger.debug('post_logout')
    return "Post logout from {}".format(_rp.client_get("service_context").issuer)


# RP initiated logout
@oidc_rp_views.route('/api/vipps/logout')
def logout():
    logger.debug('logout')
    _info = current_app.rph.logout(state=session['state'])
    logger.debug('logout redirect to "{}"'.format(_info['url']))
    return redirect(_info['url'], 303)


@oidc_rp_views.route('/api/vipps/bc_logout/<op_identifier>', methods=['GET', 'POST'])
def backchannel_logout(op_identifier):
    _rp = get_rp(op_identifier)
    try:
        _state = rp_handler.backchannel_logout(_rp, request.data)
    except Exception as err:
        logger.error('Exception: {}'.format(err))
        return 'System error!', 400
    else:
        _rp.session_interface.remove_state(_state)
        return "OK"


@oidc_rp_views.route('/api/vipps/fc_logout/<op_identifier>', methods=['GET', 'POST'])
def frontchannel_logout(op_identifier):
    _rp = get_rp(op_identifier)
    sid = request.args['sid']
    _iss = request.args['iss']
    if _iss != _rp.client_get("service_context").get('issuer'):
        return 'Bad request', 400
    _state = _rp.session_interface.get_state_by_sid(sid)
    _rp.session_interface.remove_state(_state)
    return "OK"