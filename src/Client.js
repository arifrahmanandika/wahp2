'use strict';

const path = require('path');
const fs = require('fs');
const EventEmitter = require('events');
const puppeteer = require('puppeteer');
const moduleRaid = require('@pedroslopez/moduleraid/moduleraid');
//const jsQR = require('jsqr');

const Util = require('./util/Util');
const InterfaceController = require('./util/InterfaceController');
const { WhatsWebURL, DefaultOptions, Events, WAState } = require('./util/Constants');
const { ExposeStore, LoadUtils } = require('./util/Injected');
const WebCacheFactory = require('./webCache/WebCacheFactory');
const ChatFactory = require('./factories/ChatFactory');
const ContactFactory = require('./factories/ContactFactory');
const { ClientInfo, Message, MessageMedia, Contact, Location, GroupNotification , Label, Call, Buttons, List, Reaction} = require('./structures');
/**
 * Starting point for interacting with the WhatsApp Web API
 * @extends {EventEmitter}
 * @param {object} options - Client options
 * @param {number} options.authTimeoutMs - Timeout for authentication selector in puppeteer
 * @param {object} options.puppeteer - Puppeteer launch options. View docs here: https://github.com/puppeteer/puppeteer/
 * @param {string} options.webVersion - The version of WhatsApp Web to use. Use options.webVersionCache to configure how the version is retrieved.
 * @param {object} options.webVersionCache - Determines how to retrieve the WhatsApp Web version. Defaults to a local cache (LocalWebCache) that falls back to latest if the requested version is not found.
 * @param {number} options.qrMaxRetries - How many times should the qrcode be refreshed before giving up
 * @param {string} options.restartOnAuthFail  - Restart client with a new session (i.e. use null 'session' var) if authentication fails
 * @param {boolean} options.useDeprecatedSessionAuth - Enable JSON-based authentication. This is deprecated due to not being supported by MultiDevice, and will be removed in a future version.
 * @param {object} options.session - This is deprecated due to not being supported by MultiDevice, and will be removed in a future version.
 * @param {number} options.takeoverOnConflict - If another whatsapp web session is detected (another browser), take over the session in the current browser
 * @param {number} options.takeoverTimeoutMs - How much time to wait before taking over the session
 * @param {string} options.dataPath - Change the default path for saving session files, default is: "./WWebJS/"
 * @param {string} options.userAgent - User agent to use in puppeteer
 * @param {string} options.ffmpegPath - Ffmpeg path to use when formating videos to webp while sending stickers 
 * @param {boolean} options.bypassCSP - Sets bypassing of page's Content-Security-Policy.
 * @param {string} options.clientId - Client id to distinguish instances if you are using multiple, otherwise keep null if you are using only one instance
 * 
 * @fires Client#qr
 * @fires Client#authenticated
 * @fires Client#auth_failure
 * @fires Client#ready
 * @fires Client#message
 * @fires Client#message_ack
 * @fires Client#message_create
 * @fires Client#message_revoke_me
 * @fires Client#message_revoke_everyone
 * @fires Client#media_uploaded
 * @fires Client#group_join
 * @fires Client#group_leave
 * @fires Client#group_update
 * @fires Client#disconnected
 * @fires Client#change_state
 */
class Client extends EventEmitter {
    constructor(options = {}) {
        super();

        this.options = Util.mergeDefault(DefaultOptions, options);

        this.id = this.options.clientId;

        // eslint-disable-next-line no-useless-escape
        const foldernameRegex = /^(?!.{256,})(?!(aux|clock\$|con|nul|prn|com[1-9]|lpt[1-9])(?:$|\.))[^ ][ \.\w-$()+=[\];#@~,&amp;']+[^\. ]$/i;
        if (this.id && !foldernameRegex.test(this.id)) throw Error('Invalid client ID. Make sure you abide by the folder naming rules of your operating system.');
        
        if(!this.options.useDeprecatedSessionAuth) {
            this.dataDir = this.options.puppeteer.userDataDir;
            const dirPath = path.join(process.cwd(), this.options.dataPath, this.id ? 'session-' + this.id : 'session'); 
            if (!this.dataDir) this.dataDir = dirPath;
        }

        this.pupBrowser = null;
        this.pupPage = null;

        Util.setFfmpegPath(this.options.ffmpegPath);
    }

    /**
     * Sets up events and requirements, kicks off authentication request
     */
    async initialize() {
        let [browser, page] = [null, null];
        
        const puppeteerOpts = {
            ...this.options.puppeteer,
            userDataDir: this.options.useDeprecatedSessionAuth ? undefined : this.dataDir
        };
        if(puppeteerOpts && puppeteerOpts.browserWSEndpoint) {
            browser = await puppeteer.connect(puppeteerOpts);
            page = await browser.newPage();
        } else {
            browser = await puppeteer.launch(puppeteerOpts);
            page = (await browser.pages())[0];
        }        
        
        page.setUserAgent(this.options.userAgent);

        this.pupBrowser = browser;
        this.pupPage = page;
		await this.initWebVersionCache();

  /*      if (this.options.useDeprecatedSessionAuth && this.options.session) {
            
            await page.evaluateOnNewDocument(
                session => {
                    localStorage.clear();
                    localStorage.setItem('WABrowserId', session.WABrowserId);
                    localStorage.setItem('WASecretBundle', session.WASecretBundle);
                    localStorage.setItem('WAToken1', session.WAToken1);
                    localStorage.setItem('WAToken2', session.WAToken2);
                }, this.options.session);
        } 

        if(this.options.bypassCSP) {
            await page.setBypassCSP(true);
        }
	*/	
		 // isOfficialClient)
        await page.evaluateOnNewDocument(() => {
            const originalError = Error;
            //eslint-disable-next-line no-global-assign
            Error = function (message) {
                const error = new originalError(message);
                const originalStack = error.stack;
                if (error.stack.includes('moduleRaid')) error.stack = originalStack + '\n    at https://web.whatsapp.com/vendors~lazy_loaded_low_priority_components.05e98054dbd60f980427.js:2:44';
                return error;
            };
        });
		
        await page.goto(WhatsWebURL, {
            waitUntil: 'load',
            timeout: 0,
        });
		await page.evaluate(`function getElementByXpath(path) {
            return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
          }`);
		  
        let lastPercent = null,
            lastPercentMessage = null;

        await page.exposeFunction('loadingScreen', async (percent, message) => {
            if (lastPercent !== percent || lastPercentMessage !== message) {
                this.emit(Events.LOADING_SCREEN, percent, message);
                lastPercent = percent;
                lastPercentMessage = message;
            }
        });

        await page.evaluate(
            async function (selectors) {
                var observer = new MutationObserver(function () {
                    let progressBar = window.getElementByXpath(
                        selectors.PROGRESS
                    );
                    let progressMessage = window.getElementByXpath(
                        selectors.PROGRESS_MESSAGE
                    );

                    if (progressBar) {
                        window.loadingScreen(
                            progressBar.value,
                            progressMessage.innerText
                        );
                    }
                });

                observer.observe(document, {
                    attributes: true,
                    childList: true,
                    characterData: true,
                    subtree: true,
                });
            },
            {
                PROGRESS: '//*[@id=\'app\']/div/div/div[2]/progress',
                PROGRESS_MESSAGE: '//*[@id=\'app\']/div/div/div[3]',
            }
        );


        //const INTRO_IMG_SELECTOR = '[data-testid="intro-md-beta-logo-dark"], [data-testid="intro-md-beta-logo-light"], [data-asset-intro-image-light="true"], [data-asset-intro-image-dark="true"]';
		//const INTRO_IMG_SELECTOR = "[data-icon='chat']";
		const INTRO_IMG_SELECTOR ='[data-icon=\'search\']';
         const INTRO_QRCODE_SELECTOR = 'div[data-ref] canvas';

        // Checks which selector appears first
        const needAuthentication = await Promise.race([
            new Promise(resolve => {
                page.waitForSelector(INTRO_IMG_SELECTOR, { timeout: this.options.authTimeoutMs })
                    .then(() => resolve(false))
                    .catch((err) => resolve(err));
            }),
            new Promise(resolve => {
                page.waitForSelector(INTRO_QRCODE_SELECTOR, { timeout: this.options.authTimeoutMs })
                    .then(() => resolve(true))
                    .catch((err) => resolve(err));
            })
        ]);

        // Checks if an error ocurred on the first found selector. The second will be discarted and ignored by .race;
        if (needAuthentication instanceof Error) throw needAuthentication;

        // Scan-qrcode selector was found. Needs authentication
        if (needAuthentication) {
            const QR_CONTAINER = 'div[data-ref]';
            const QR_RETRY_BUTTON = 'div[data-ref] > span > button';
         
            let qrRetries = 0;

           await page.exposeFunction('qrChanged', async (qr) => {
                this.emit(Events.QR_RECEIVED, qr);
                if (this.options.qrMaxRetries > 0) {
                    qrRetries++;
                    if (qrRetries > this.options.qrMaxRetries) {
                        this.emit(Events.DISCONNECTED, 'Max qrcode retries reached');
                        await this.destroy();
                    }
                
                }
            });

            await page.evaluate(function(selectors) {
                const qr_container = document.querySelector(selectors.QR_CONTAINER);
                window.qrChanged(qr_container.dataset.ref);

                const obs = new MutationObserver((muts) => {
                    muts.forEach(mut => {
                        // Listens to qr token change
                        if (mut.type === 'attributes' && mut.attributeName === 'data-ref') {
                            window.qrChanged(mut.target.dataset.ref);
                        } else
                        // Listens to retry button, when found, click it
                        if (mut.type === 'childList') {
                            const retry_button = document.querySelector(selectors.QR_RETRY_BUTTON);
                            if (retry_button) retry_button.click();
                        }
                    });
                });
                obs.observe(qr_container.parentElement, {
                    subtree: true,
                    childList: true,
                    attributes: true,
                    attributeFilter: ['data-ref'],
                });
            }, { 
                QR_CONTAINER, 
                QR_RETRY_BUTTON 
            });

            // Wait for code scan
            await page.waitForSelector(INTRO_IMG_SELECTOR, { timeout: 0 });
            
        }

        await page.evaluate(ExposeStore, moduleRaid.toString());

        let authEventPayload = undefined;
        if(this.options.useDeprecatedSessionAuth) {
            // Get session tokens
            const localStorage = JSON.parse(await page.evaluate(() => {
                return JSON.stringify(window.localStorage);
            }));
    
            authEventPayload = {
                WABrowserId: localStorage.WABrowserId,
                WASecretBundle: localStorage.WASecretBundle,
                WAToken1: localStorage.WAToken1,
                WAToken2: localStorage.WAToken2
            };
        }

        /**
         * Emitted when authentication is successful
         * @event Client#authenticated
         */
        this.emit(Events.AUTHENTICATED, authEventPayload);

        // Check window.Store Injection
        await page.waitForFunction('window.Store != undefined');

        const isMD = await page.evaluate(() => {
            return window.Store.MDBackend;
        });
		
		/* await page.evaluate(async () => {
            // safely unregister service workers
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (let registration of registrations) { 
                registration.unregister();
            }

        });
*/		

	//	 await page.evaluate(() => {
            /**
             * Helper function that compares between two WWeb versions. Its purpose is to help the developer to choose the correct code implementation depending on the comparison value and the WWeb version.
             * @param {string} lOperand The left operand for the WWeb version string to compare with
             * @param {string} operator The comparison operator
             * @param {string} rOperand The right operand for the WWeb version string to compare with
             * @returns {boolean} Boolean value that indicates the result of the comparison
             */
       /*     window.compareWwebVersions = (lOperand, operator, rOperand) => {
                if (!['>', '>=', '<', '<=', '='].includes(operator)) {
                    throw class _ extends Error {
                        constructor(m) { super(m); this.name = 'CompareWwebVersionsError'; }
                    }('Invalid comparison operator is provided');

                }
                if (typeof lOperand !== 'string' || typeof rOperand !== 'string') {
                    throw class _ extends Error {
                        constructor(m) { super(m); this.name = 'CompareWwebVersionsError'; }
                    }('A non-string WWeb version type is provided');
                }

                lOperand = lOperand.replace(/-beta$/, '');
                rOperand = rOperand.replace(/-beta$/, '');

                while (lOperand.length !== rOperand.length) {
                    lOperand.length > rOperand.length
                        ? rOperand = rOperand.concat('0')
                        : lOperand = lOperand.concat('0');
                }

                lOperand = Number(lOperand.replace(/\./g, ''));
                rOperand = Number(rOperand.replace(/\./g, ''));

                return (
                    operator === '>' ? lOperand > rOperand :
                        operator === '>=' ? lOperand >= rOperand :
                            operator === '<' ? lOperand < rOperand :
                                operator === '<=' ? lOperand <= rOperand :
                                    operator === '=' ? lOperand === rOperand :
                                        false
                );
            };
        });
*/
        if(this.options.useDeprecatedSessionAuth && isMD) {
            throw new Error('Authenticating via JSON session is not supported for MultiDevice-enabled WhatsApp accounts.');
        }

        //Load util functions (serializers, helper functions)
        await page.evaluate(LoadUtils);

        // Expose client info
        /**
         * Current connection information
         * @type {ClientInfo}
         */
        this.info = new ClientInfo(this, await page.evaluate(() => {
            return {...window.Store.Conn.serialize(), wid: window.Store.User.getMeUser()};
        }));

        // Add InterfaceController
        this.interface = new InterfaceController(this);

        // Register events
        await page.exposeFunction('onAddMessageEvent', msg => {
            //if (!msg.isNewMsg) return;

            if (msg.type === 'gp2') {
                const notification = new GroupNotification(this, msg);
                if (msg.subtype === 'add' || msg.subtype === 'invite') {
                    /**
                     * Emitted when a user joins the chat via invite link or is added by an admin.
                     * @event Client#group_join
                     * @param {GroupNotification} notification GroupNotification with more information about the action
                     */
                    this.emit(Events.GROUP_JOIN, notification);
                } else if (msg.subtype === 'remove' || msg.subtype === 'leave') {
                    /**
                     * Emitted when a user leaves the chat or is removed by an admin.
                     * @event Client#group_leave
                     * @param {GroupNotification} notification GroupNotification with more information about the action
                     */
                    this.emit(Events.GROUP_LEAVE, notification);
                } else {
                    /**
                     * Emitted when group settings are updated, such as subject, description or picture.
                     * @event Client#group_update
                     * @param {GroupNotification} notification GroupNotification with more information about the action
                     */
                    this.emit(Events.GROUP_UPDATE, notification);
                }
                return;
            }

            const message = new Message(this, msg);

            /**
             * Emitted when a new message is created, which may include the current user's own messages.
             * @event Client#message_create
             * @param {Message} message The message that was created
             */
            this.emit(Events.MESSAGE_CREATE, message);

            if (msg.id.fromMe) return;

            /**
             * Emitted when a new message is received.
             * @event Client#message
             * @param {Message} message The message that was received
             */
            this.emit(Events.MESSAGE_RECEIVED, message);
        });

        let last_message;

        await page.exposeFunction('onChangeMessageTypeEvent', (msg) => {

            if (msg.type === 'revoked') {
                const message = new Message(this, msg);
                let revoked_msg;
                if (last_message && msg.id.id === last_message.id.id) {
                    revoked_msg = new Message(this, last_message);
                }

                /**
                 * Emitted when a message is deleted for everyone in the chat.
                 * @event Client#message_revoke_everyone
                 * @param {Message} message The message that was revoked, in its current state. It will not contain the original message's data.
                 * @param {?Message} revoked_msg The message that was revoked, before it was revoked. It will contain the message's original data. 
                 * Note that due to the way this data is captured, it may be possible that this param will be undefined.
                 */
                this.emit(Events.MESSAGE_REVOKED_EVERYONE, message, revoked_msg);
            }

        });

        await page.exposeFunction('onChangeMessageEvent', (msg) => {

            if (msg.type !== 'revoked') {
                last_message = msg;
            }

        });

        await page.exposeFunction('onRemoveMessageEvent', (msg) => {

            if (!msg.isNewMsg) return;

            const message = new Message(this, msg);

            /**
             * Emitted when a message is deleted by the current user.
             * @event Client#message_revoke_me
             * @param {Message} message The message that was revoked
             */
            this.emit(Events.MESSAGE_REVOKED_ME, message);

        });

        await page.exposeFunction('onMessageAckEvent', (msg, ack) => {

            const message = new Message(this, msg);

            /**
             * Emitted when an ack event occurrs on message type.
             * @event Client#message_ack
             * @param {Message} message The message that was affected
             * @param {MessageAck} ack The new ACK value
             */
            this.emit(Events.MESSAGE_ACK, message, ack);

        });

        await page.exposeFunction('onMessageMediaUploadedEvent', (msg) => {

            const message = new Message(this, msg);

            /**
             * Emitted when media has been uploaded for a message sent by the client.
             * @event Client#media_uploaded
             * @param {Message} message The message with media that was uploaded
             */
            this.emit(Events.MEDIA_UPLOADED, message);
        });

        await page.exposeFunction('onAppStateChangedEvent', (state) => {

            /**
             * Emitted when the connection state changes
             * @event Client#change_state
             * @param {WAState} state the new connection state
             */
            this.emit(Events.STATE_CHANGED, state);

            const ACCEPTED_STATES = [WAState.CONNECTED, WAState.OPENING, WAState.PAIRING, WAState.TIMEOUT];

            if (this.options.takeoverOnConflict) {
                ACCEPTED_STATES.push(WAState.CONFLICT);

                if (state === WAState.CONFLICT) {
                    setTimeout(() => {
                        this.pupPage.evaluate(() => window.Store.AppState.takeover());
                    }, this.options.takeoverTimeoutMs);
                }
            }

            if (!ACCEPTED_STATES.includes(state)) {
                /**
                 * Emitted when the client has been disconnected
                 * @event Client#disconnected
                 * @param {WAState|"NAVIGATION"} reason reason that caused the disconnect
                 */
                this.emit(Events.DISCONNECTED, state);
                this.destroy();
            }
        });

        await page.exposeFunction('onIncomingCall', (call) => {
            /**
             * Emitted when a call is received
             * @event Client#incoming_call
             * @param {object} call
             * @param {number} call.id - Call id
             * @param {string} call.peerJid - Who called
             * @param {boolean} call.isVideo - if is video
             * @param {boolean} call.isGroup - if is group
             * @param {boolean} call.canHandleLocally - if we can handle in waweb
             * @param {boolean} call.outgoing - if is outgoing
             * @param {boolean} call.webClientShouldHandle - If Waweb should handle
             * @param {object} call.participants - Participants
             */
            const cll = new Call(this,call);
            this.emit(Events.INCOMING_CALL, cll);
        });
        
		await page.exposeFunction('onReaction', (reactions) => {
            for (const reaction of reactions) {
                /**
                 * Emitted when a reaction is sent, received, updated or removed
                 * @event Client#message_reaction
                 * @param {object} reaction
                 * @param {object} reaction.id - Reaction id
                 * @param {number} reaction.orphan - Orphan
                 * @param {?string} reaction.orphanReason - Orphan reason
                 * @param {number} reaction.timestamp - Timestamp
                 * @param {string} reaction.reaction - Reaction
                 * @param {boolean} reaction.read - Read
                 * @param {object} reaction.msgId - Parent message id
                 * @param {string} reaction.senderId - Sender id
                 * @param {?number} reaction.ack - Ack
                 */

                this.emit(Events.MESSAGE_REACTION, new Reaction(this, reaction));
            }
        });				
        await page.evaluate(() => {
            window.Store.Msg.on('change', (msg) => { window.onChangeMessageEvent(window.WWebJS.getMessageModel(msg)); });
            window.Store.Msg.on('change:type', (msg) => { window.onChangeMessageTypeEvent(window.WWebJS.getMessageModel(msg)); });
            window.Store.Msg.on('change:ack', (msg, ack) => { window.onMessageAckEvent(window.WWebJS.getMessageModel(msg), ack); });
            window.Store.Msg.on('change:isUnsentMedia', (msg, unsent) => { if (msg.id.fromMe && !unsent) window.onMessageMediaUploadedEvent(window.WWebJS.getMessageModel(msg)); });
            window.Store.Msg.on('remove', (msg) => { if (msg.isNewMsg) window.onRemoveMessageEvent(window.WWebJS.getMessageModel(msg)); });
            window.Store.AppState.on('change:state', (_AppState, state) => { window.onAppStateChangedEvent(state); });
            window.Store.Call.on('add', (call) => { window.onIncomingCall(call); });
            window.Store.Msg.on('add', (msg) => { 
                if (msg.isNewMsg) {
                    if(msg.type === 'ciphertext') {
                        // defer message event until ciphertext is resolved (type changed)
                        msg.once('change:type', (_msg) => window.onAddMessageEvent(window.WWebJS.getMessageModel(_msg)));
                    } else {
                        window.onAddMessageEvent(window.WWebJS.getMessageModel(msg)); 
                    }
                }
            });
                const module = window.Store.createOrUpdateReactionsModule;
                const ogMethod = module.createOrUpdateReactions;
                module.createOrUpdateReactions = ((...args) => {
                    window.onReaction(args[0].map(reaction => {
                        const msgKey = window.Store.MsgKey.fromString(reaction.msgKey);
                        const parentMsgKey = window.Store.MsgKey.fromString(reaction.parentMsgKey);
                        const timestamp = reaction.timestamp / 1000;

                        return {...reaction, msgKey, parentMsgKey, timestamp };
                    }));

                    return ogMethod(...args);
                }).bind(module);
            }
        );

        /**
         * Emitted when the client has initialized and is ready to receive messages.
         * @event Client#ready
         */
        this.emit(Events.READY);

        // Disconnect when navigating away
        // Because WhatsApp Web now reloads when logging out from the device, this also covers that case
        this.pupPage.on('framenavigated', async () => {
            const appState = await this.getState();
            if(appState === WAState.PAIRING) {
                this.emit(Events.DISCONNECTED, 'NAVIGATION');
                await this.destroy();
            }
        });
    }



    async initWebVersionCache() {
        const { type: webCacheType, ...webCacheOptions } = this.options.webVersionCache;
        const webCache = WebCacheFactory.createWebCache(webCacheType, webCacheOptions);

        const requestedVersion = this.options.webVersion;
        const versionContent = await webCache.resolve(requestedVersion);

        if(versionContent) {
            await this.pupPage.setRequestInterception(true);
            this.pupPage.on('request', async (req) => {
                if(req.url() === WhatsWebURL) {
                    req.respond({
                        status: 200,
                        contentType: 'text/html',
                        body: versionContent
                    }); 
                } else {
                    req.continue();
                }
            });
        } else {
            this.pupPage.on('response', async (res) => {
                if(res.ok() && res.url() === WhatsWebURL) {
                    await webCache.persist(await res.text());
                }
            });
        }
    }



    /**
     * Closes the client
     */
    async destroy() {
      
        await this.pupBrowser.close();
    }

    /**
     * Logs out the client, closing the current session
     */
    async logout() {
        await this.pupPage.evaluate(() => {
            return window.Store.AppState.logout();
        });

        if(this.dataDir) {
            return fs.rmdirSync(this.dataDir, {recursive: true});
        }
    }

    /**
     * Returns the version of WhatsApp Web currently being run
     * @returns {Promise<string>}
     */
    async getWWebVersion() {
        return await this.pupPage.evaluate(() => {
            return window.Debug.VERSION;
        });
    }

    /**
     * Mark as seen for the Chat
     *  @param {string} chatId
     *  @returns {Promise<boolean>} result
     * 
     */
    async sendSeen(chatId) {
        const result = await this.pupPage.evaluate(async (chatId) => {
            return window.WWebJS.sendSeen(chatId);

        }, chatId);
        return result;
    }

    /**
     * Message options.
     * @typedef {Object} MessageSendOptions
     * @property {boolean} [linkPreview=true] - Show links preview.
     * @property {boolean} [sendAudioAsVoice=false] - Send audio as voice message
     * @property {boolean} [sendVideoAsGif=false] - Send video as gif
     * @property {boolean} [sendMediaAsSticker=false] - Send media as a sticker
     * @property {boolean} [sendMediaAsDocument=false] - Send media as a document
     * @property {boolean} [parseVCards=true] - Automatically parse vCards and send them as contacts
     * @property {string} [caption] - Image or video caption
     * @property {string} [quotedMessageId] - Id of the message that is being quoted (or replied to)
     * @property {Contact[]} [mentions] - Contacts that are being mentioned in the message
     * @property {boolean} [sendSeen=true] - Mark the conversation as seen after sending the message
     * @property {string} [stickerAuthor=undefined] - Sets the author of the sticker, (if sendMediaAsSticker is true).
     * @property {string} [stickerName=undefined] - Sets the name of the sticker, (if sendMediaAsSticker is true).
     * @property {string[]} [stickerCategories=undefined] - Sets the categories of the sticker, (if sendMediaAsSticker is true). Provide emoji char array, can be null.
     * @property {MessageMedia} [media] - Media to be sent
     */

    /**
     * Send a message to a specific chatId
     * @param {string} chatId
     * @param {string|MessageMedia|Location|Contact|Array<Contact>|Buttons|List|Reaction} content
     * @param {MessageSendOptions} [options] - Options used when sending the message
     * 
     * @returns {Promise<Message>} Message that was just sent
     */
    async sendMessage(chatId, content, options = {}) {
        let internalOptions = {
            linkPreview: options.linkPreview === false ? undefined : true,
            sendAudioAsVoice: options.sendAudioAsVoice,
            sendVideoAsGif: options.sendVideoAsGif,
            sendMediaAsSticker: options.sendMediaAsSticker,
            sendMediaAsDocument: options.sendMediaAsDocument,
            caption: options.caption,
            quotedMessageId: options.quotedMessageId,
            parseVCards: options.parseVCards === false ? false : true,
            mentionedJidList: Array.isArray(options.mentions) ? options.mentions.map(contact => contact.id._serialized) : [],
            extraOptions: options.extra
        };

        const sendSeen = typeof options.sendSeen === 'undefined' ? true : options.sendSeen;

        if (content instanceof MessageMedia) {
            internalOptions.attachment = content;
            content = '';
        } else if (options.media instanceof MessageMedia) {
            internalOptions.attachment = options.media;
            internalOptions.caption = content;
            content = '';
        } else if (content instanceof Location) {
            internalOptions.location = content;
            content = '';
        } else if(content instanceof Contact) {
            internalOptions.contactCard = content.id._serialized;
            content = '';
        } else if(Array.isArray(content) && content.length > 0 && content[0] instanceof Contact) {
            internalOptions.contactCardList = content.map(contact => contact.id._serialized);
            content = '';
        } else if(content instanceof Buttons){
            if(content.type !== 'chat'){internalOptions.attachment = content.body;}
            internalOptions.buttons = content;
            content = '';
        } else if(content instanceof List){
            internalOptions.list = content;
            content = '';
        } 

        if (internalOptions.sendMediaAsSticker && internalOptions.attachment) {
            internalOptions.attachment = await Util.formatToWebpSticker(
                 internalOptions.attachment, {
                    name: options.stickerName,
                    author: options.stickerAuthor,
                    categories: options.stickerCategories
                }, this.pupPage
            );
        }

        const newMessage = await this.pupPage.evaluate(async (chatId, message, options, sendSeen) => {
            const chatWid = window.Store.WidFactory.createWid(chatId);
            const chat = await window.Store.Chat.find(chatWid);

            if (sendSeen) {
                window.WWebJS.sendSeen(chatId);
            }

            const msg = await window.WWebJS.sendMessage(chat, message, options, sendSeen);
            return msg.serialize();
        }, chatId, content, internalOptions, sendSeen);

        return new Message(this, newMessage);
    }

    /**
     * Searches for messages
     * @param {string} query
     * @param {Object} [options]
     * @param {number} [options.page]
     * @param {number} [options.limit]
     * @param {string} [options.chatId]
     * @returns {Promise<Message[]>}
     */
    async searchMessages(query, options = {}) {
        const messages = await this.pupPage.evaluate(async (query, page, count, remote) => {
            const { messages } = await window.Store.Msg.search(query, page, count, remote);
            return messages.map(msg => window.WWebJS.getMessageModel(msg));
        }, query, options.page, options.limit, options.chatId);

        return messages.map(msg => new Message(this, msg));
    }

    /**
     * Get all current chat instances
     * @returns {Promise<Array<Chat>>}
     */
    async getChats() {
        let chats = await this.pupPage.evaluate(async () => {
            return await window.WWebJS.getChats();
        });

        return chats.map(chat => ChatFactory.create(this, chat));
    }

    /**
     * Get chat instance by ID
     * @param {string} chatId 
     * @returns {Promise<Chat>}
     */
    async getChatById(chatId) {
        let chat = await this.pupPage.evaluate(async chatId => {
            return await window.WWebJS.getChat(chatId);
        }, chatId);

        return ChatFactory.create(this, chat);
    }

    /**
     * Get all current contact instances
     * @returns {Promise<Array<Contact>>}
     */
    async getContacts() {
        let contacts = await this.pupPage.evaluate(() => {
            return window.WWebJS.getContacts();
        });

        return contacts.map(contact => ContactFactory.create(this, contact));
    }

    /**
     * Get contact instance by ID
     * @param {string} contactId
     * @returns {Promise<Contact>}
     */
    async getContactById(contactId) {
        let contact = await this.pupPage.evaluate(contactId => {
            return window.WWebJS.getContact(contactId);
        }, contactId);

        return ContactFactory.create(this, contact);
    }

    /**
     * Returns an object with information about the invite code's group
     * @param {string} inviteCode 
     * @returns {Promise<object>} Invite information
     */
    async getInviteInfo(inviteCode) {
        return await this.pupPage.evaluate(inviteCode => {
            return window.Store.InviteInfo.sendQueryGroupInvite(inviteCode);
        }, inviteCode);
    }

    /**
     * Accepts an invitation to join a group
     * @param {string} inviteCode Invitation code
     * @returns {Promise<string>} Id of the joined Chat
     */
    async acceptInvite(inviteCode) {
        const chatId = await this.pupPage.evaluate(async inviteCode => {
            return await window.Store.Invite.sendJoinGroupViaInvite(inviteCode);
        }, inviteCode);

        return chatId._serialized;
    }

    /**
     * Accepts a private invitation to join a group
     * @param {object} inviteInfo Invite V4 Info
     * @returns {Promise<Object>}
     */
    async acceptGroupV4Invite(inviteInfo) {
        if(!inviteInfo.inviteCode) throw 'Invalid invite code, try passing the message.inviteV4 object';
        if (inviteInfo.inviteCodeExp == 0) throw 'Expired invite code';
        return this.pupPage.evaluate(async inviteInfo => {
            let { groupId, fromId, inviteCode, inviteCodeExp } = inviteInfo;
            return await window.Store.JoinInviteV4.sendJoinGroupViaInviteV4(inviteCode, String(inviteCodeExp), groupId, fromId);
        }, inviteInfo);
    }
    
    /**
     * Sets the current user's status message
     * @param {string} status New status message
     */
    async setStatus(status) {
        await this.pupPage.evaluate(async status => {
            return await window.Store.StatusUtils.setMyStatus(status);
        }, status);
    }

    /**
     * Sets the current user's display name. 
     * This is the name shown to WhatsApp users that have not added you as a contact beside your number in groups and in your profile.
     * @param {string} displayName New display name
	 * @returns {Promise<Boolean>}							  
     */
    async setDisplayName(displayName) {
        const couldSet = await this.pupPage.evaluate(async displayName => {
            if(!window.Store.Conn.canSetMyPushname()) return false;

            if(window.Store.MDBackend) {
                // TODO
                return false;
            } else {
                const res = await window.Store.Wap.setPushname(displayName);
                return !res.status || res.status === 200;
            }
        }, displayName);

        return couldSet;
    }

    /**
     * Gets the current connection state for the client
     * @returns {WAState} 
     */
    async getState() {
        return await this.pupPage.evaluate(() => {
            return window.Store.AppState.state;
        });
    }

    /**
     * Marks the client as online
     */
    async sendPresenceAvailable() {
        return await this.pupPage.evaluate(() => {
            return window.Store.PresenceUtils.sendPresenceAvailable();
        });
    }

    /**
     * Marks the client as unavailable
     */
    async sendPresenceUnavailable() {
        return await this.pupPage.evaluate(() => {
            return window.Store.PresenceUtils.sendPresenceUnavailable();
        });
    }

    /**
     * Enables and returns the archive state of the Chat
     * @returns {boolean}
     */
    async archiveChat(chatId) {
        return await this.pupPage.evaluate(async chatId => {
            let chat = await window.Store.Chat.get(chatId);
            await window.Store.Cmd.archiveChat(chat, true);
            return true;
        }, chatId);
    }

    /**
     * Changes and returns the archive state of the Chat
     * @returns {boolean}
     */
    async unarchiveChat(chatId) {
        return await this.pupPage.evaluate(async chatId => {
            let chat = await window.Store.Chat.get(chatId);
            await window.Store.Cmd.archiveChat(chat, false);
            return false;
        }, chatId);
    }

    /**
     * Pins the Chat
     * @returns {Promise<boolean>} New pin state. Could be false if the max number of pinned chats was reached.
     */
    async pinChat(chatId) {
        return this.pupPage.evaluate(async chatId => {
            let chat = window.Store.Chat.get(chatId);
            if (chat.pin) {
                return true;
            }
            const MAX_PIN_COUNT = 3;
			const chatModels = window.Store.Chat.getModelsArray();
            if (chatModels.length > MAX_PIN_COUNT) {
                let maxPinned = chatModels[MAX_PIN_COUNT - 1].pin;
                if (maxPinned) {
                    return false;
                }
            }
            await window.Store.Cmd.pinChat(chat, true);
            return true;
        }, chatId);
    }

    /**
     * Unpins the Chat
     * @returns {Promise<boolean>} New pin state
     */
    async unpinChat(chatId) {
        return this.pupPage.evaluate(async chatId => {
            let chat = window.Store.Chat.get(chatId);
            if (!chat.pin) {
                return false;
            }
            await window.Store.Cmd.pinChat(chat, false);
            return false;
        }, chatId);
    }

    /**
     * Mutes this chat forever, unless a date is specified
     * @param {string} chatId ID of the chat that will be muted
     * @param {?Date} unmuteDate Date when the chat will be unmuted, leave as is to mute forever
     */
    async muteChat(chatId, unmuteDate) {
        unmuteDate = unmuteDate ? unmuteDate.getTime() / 1000 : -1;
        await this.pupPage.evaluate(async (chatId, timestamp) => {
            let chat = await window.Store.Chat.get(chatId);
            await chat.mute.mute({expiration: timestamp, sendDevice:!0});
        }, chatId, unmuteDate || -1);
    }

    /**
     * Unmutes the Chat
     * @param {string} chatId ID of the chat that will be unmuted
     */
    async unmuteChat(chatId) {
        await this.pupPage.evaluate(async chatId => {
            let chat = await window.Store.Chat.get(chatId);
            await window.Store.Cmd.muteChat(chat, false);
        }, chatId);
    }

    /**
     * Mark the Chat as unread
     * @param {string} chatId ID of the chat that will be marked as unread
     */
    async markChatUnread(chatId) {
        await this.pupPage.evaluate(async chatId => {
            let chat = await window.Store.Chat.get(chatId);
            await window.Store.Cmd.markChatUnread(chat, true);
        }, chatId);
    }

    /**
     * Returns the contact ID's profile picture URL, if privacy settings allow it
     * @param {string} contactId the whatsapp user's ID
     * @returns {Promise<string>}
     */
    async getProfilePicUrl(contactId) {
       const profilePic = await this.pupPage.evaluate(async contactId => {
            try {
                const chatWid = window.Store.WidFactory.createWid(contactId);
                return await window.Store.ProfilePic.profilePicFind(chatWid);
            } catch (err) {
                if(err.name === 'ServerStatusCodeError') return undefined;
                throw err;
            }
        }, contactId);

        return profilePic ? profilePic.eurl : undefined;
    }

    /**
     * Gets the Contact's common groups with you. Returns empty array if you don't have any common group.
     * @param {string} contactId the whatsapp user's ID (_serialized format)
     * @returns {Promise<WAWebJS.ChatId[]>}
     */
    async getCommonGroups(contactId) {
        const commonGroups = await this.pupPage.evaluate(async (contactId) => {
            let contact = window.Store.Contact.get(contactId);
            if (!contact) {
                const wid = window.Store.WidFactory.createUserWid(contactId);
                const chatConstructor = window.Store.Contact.getModelsArray().find(c=>!c.isGroup).constructor;
                contact = new chatConstructor({id: wid});
            }

            if (contact.commonGroups) {
                return contact.commonGroups.serialize();
            }
            const status = await window.Store.findCommonGroups(contact);
            if (status) {
                return contact.commonGroups.serialize();
            }
            return [];
        }, contactId);
        const chats = [];
        for (const group of commonGroups) {
            chats.push(group.id);
        }
        return chats;
    }

    /**
     * Force reset of connection state for the client
    */
    async resetState() {
        await this.pupPage.evaluate(() => {
            window.Store.AppState.phoneWatchdog.shiftTimer.forceRunNow();
        });
    }

    /**
     * Check if a given ID is registered in whatsapp
     * @param {string} id the whatsapp user's ID
     * @returns {Promise<Boolean>}
     */
    async isRegisteredUser(id) {

        return Boolean(await this.getNumberId(id));
    }

    /**
     * Get the registered WhatsApp ID for a number. 
     * Will return null if the number is not registered on WhatsApp.
     * @param {string} number Number or ID ("@c.us" will be automatically appended if not specified)
     * @returns {Promise<Object|null>}
     */
    async getNumberId(number) {
        if (!number.endsWith('@c.us')) {
            number += '@c.us';
        }

        return await this.pupPage.evaluate(async number => {
            const wid = window.Store.WidFactory.createWid(number);
            const result = await window.Store.QueryExist(wid);
            if (!result || result.wid === undefined) return null;
            return result.wid;
        }, number);
    }

    /**
     * Get the formatted number of a WhatsApp ID.
     * @param {string} number Number or ID
     * @returns {Promise<string>}
     */
    async getFormattedNumber(number) {
        if(!number.endsWith('@s.whatsapp.net')) number = number.replace('c.us', 's.whatsapp.net');
        if(!number.includes('@s.whatsapp.net')) number = `${number}@s.whatsapp.net`;
        
        return await this.pupPage.evaluate(async numberId => {
            return window.Store.NumberInfo.formattedPhoneNumber(numberId);
        }, number);
    }
    
    /**
     * Get the country code of a WhatsApp ID.
     * @param {string} number Number or ID
     * @returns {Promise<string>}
     */
    async getCountryCode(number) {
        number = number.replace(' ', '').replace('+', '').replace('@c.us', '');

        return await this.pupPage.evaluate(async numberId => {
            return window.Store.NumberInfo.findCC(numberId);
        }, number);
    }
    
    /**
     * Create a new group
     * @param {string} name group title
     * @param {Array<Contact|string>} participants an array of Contacts or contact IDs to add to the group
     * @returns {Object} createRes
     * @returns {string} createRes.gid - ID for the group that was just created
     * @returns {Object.<string,string>} createRes.missingParticipants - participants that were not added to the group. Keys represent the ID for participant that was not added and its value is a status code that represents the reason why participant could not be added. This is usually 403 if the user's privacy settings don't allow you to add them to groups.
     */
    async createGroup(name, participants) {
        if (!Array.isArray(participants) || participants.length == 0) {
            throw 'You need to add at least one other participant to the group';
        }

        if (participants.every(c => c instanceof Contact)) {
            participants = participants.map(c => c.id._serialized);
        }

        const createRes = await this.pupPage.evaluate(async (name, participantIds) => {
            const participantWIDs = participantIds.map(p => window.Store.WidFactory.createWid(p));
            const id = window.Store.MsgKey.newId();
            const res = await window.Store.GroupUtils.sendCreateGroup(name, participantWIDs, undefined, id);
            return res;
        }, name, participants);
        
        const missingParticipants = createRes.participants.reduce(((missing, c) => {
            const id = Object.keys(c)[0];
            const statusCode = c[id].code;
            if (statusCode != 200) return Object.assign(missing, { [id]: statusCode });
            return missing;
        }), {});

        return { gid: createRes.gid, missingParticipants };
    }

    /**
     * Get all current Labels
     * @returns {Promise<Array<Label>>}
     */
    async getLabels() {
        const labels = await this.pupPage.evaluate(async () => {
            return window.WWebJS.getLabels();
        }); 

        return labels.map(data => new Label(this , data));
    }

    /**
     * Get Label instance by ID
     * @param {string} labelId
     * @returns {Promise<Label>}
     */
    async getLabelById(labelId) {
        const label = await this.pupPage.evaluate(async (labelId) => {
            return window.WWebJS.getLabel(labelId);
        }, labelId); 

        return new Label(this, label);
    }

    /**
     * Get all Labels assigned to a chat 
     * @param {string} chatId
     * @returns {Promise<Array<Label>>}
     */
    async getChatLabels(chatId){
        const labels = await this.pupPage.evaluate(async (chatId) => {
            return window.WWebJS.getChatLabels(chatId);
        }, chatId);

        return labels.map(data => new Label(this, data)); 
    }

    /**
     * Get all Chats for a specific Label
     * @param {string} labelId
     * @returns {Promise<Array<Chat>>}
     */
    async getChatsByLabelId(labelId){
        const chatIds = await this.pupPage.evaluate(async (labelId) => {
            const label = window.Store.Label.get(labelId);
            const labelItems = label.labelItemCollection.getModelsArray();
            return labelItems.reduce((result, item) => {
                if(item.parentType === 'Chat'){  
                    result.push(item.parentId);
                }
                return result;
            },[]);
        }, labelId);

        return Promise.all(chatIds.map(id => this.getChatById(id)));
    }

    /**
     * Gets all blocked contacts by host account
     * @returns {Promise<Array<Contact>>}
     */
    async getBlockedContacts() {
        const blockedContacts = await this.pupPage.evaluate(() => {
            let chatIds = window.Store.Blocklist.getModelsArray().map(a => a.id._serialized);
            return Promise.all(chatIds.map(id => window.WWebJS.getContact(id)));            
        });

        return blockedContacts.map(contact => ContactFactory.create(this.client, contact));
    }
}

module.exports = Client;
