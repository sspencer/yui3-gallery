	/**
	 * Local constants
	 */
    var Notify,
        Message,
        EVENTS = {
            INIT    : 'init',
            STARTED : 'started'
        }
        ;

    /**
     * Message is created as a Child Widget
     */
    Message = Y.Base.create('notify-message', Y.Widget, [Y.WidgetChild], {
    	/**
    	 * Override default widget templates
    	 */
        BOUNDING_TEMPLATE : '<li/>',
        CONTENT_TEMPLATE : '<em/>',
        
        /**
         * Create default template for close button
         */
        CLOSE_TEMPLATE : '<span class="{class}">{label}</span>',
        
        /**
         * Internal timer used to pause timeout on mouseenter
         * 
         * @property _timer
         * @protected
         */
        _timer : null,
        
        /**
         * Initializer lifecycle implementation for the Message class.
         * Publishes events and subscribes 
         * to update after the status is changed. Sets the initial state
         * to hidden so the notification can fade in.
         *
         * @method initializer
         * @public
         * @param confit {Object} Configuration object literal for
         *     the Message
         */
        initializer : function(config) {
            this.get('boundingBox').setStyle('opacity',0);
        },
        
        /**
         * Creates the message. Appends the close box if is closable
         * 
         * @method renderUI
         * @public
         */
        renderUI : function() {
            var cb = this.get('contentBox'),
                bb = this.get('boundingBox'),
                closeNode;
            
            cb.setContent(this.get('message'));
            bb.addClass(this.getClassName(this.get('flag')));
            if(this.get('closable')) {
                closeNode = Y.Node.create(Y.substitute(this.CLOSE_TEMPLATE,{
                    'class' : this.getClassName('close'),
                    'label' : 'X'
                }));
                this.set('closeNode',closeNode);
                bb.append(closeNode);
            }
        },
        
        /**
         * Binds the message hover and closable events
         * 
         * @method bindUI
         * @public
         */
        bindUI : function() {
            this._bindHover();
            if(this.get('closable')) {
                this._bindCloseClick();
            }
        },
        
        /**
         * Creates a new timer to make the message disappear and
         * fades in the message
         * 
         * @method syncUI
         * @public
         */
        syncUI : function() {
            this.timer = new Y.Timer({
                length: this.get('timeout'),
                repeatCount: 1,
                callback: Y.bind(this.close, this)
            });
            var bb = this.get('boundingBox'),
                anim = new Y.Anim({
                node : bb,
                to : {
                    opacity:1
                },
                duration: 0.3,
                on : {
                    end : Y.bind(function() {
                        this.timer.start();
                    },this)
                }
            }).run();
        },
        
        /**
         * Kills the timeout timer then animates the notification close and
         * removes the widget from the window and parent container
         * 
         * @method close
         * @pubic
         */
        close : function() {
            if(this.timer) {
                this.timer.stop();
            }
            var bb = this.get('boundingBox'),
                index = this.get('index'),
                parent = this.get('parent'),
                fade = new Y.Anim({
                node : bb,
                to : {
                    opacity : 0
                },
                duration : 0.55,
                on : {
                    end : Y.bind(function () {
                        var size = new Y.Anim({
                            node : bb,
                            to : {
                                height : 0
                            },
                            duration : 0.25,
                            on : {
                                end : Y.bind(function () {
                                    this.remove();
                                    bb.remove();
                                },this)
                            }
                        }).run();
                    },this)
                }
            }).run();
        },
        
        /**
         * Binds the close method to the close node
         * 
         * @method _bindCloseClick
         * @protected
         */
        _bindCloseClick : function() {
            this.get('closeNode').on('click',Y.bind(this.close, this));
        },
        
        /**
         * Binds mouseenter and mouseleave events to the message.
         * Mouseenter will pause the timeout timer and mouseleave
         * will restart it.
         * 
         * @method _bindHover
         * @protected
         */
        _bindHover : function() {
            var bb = this.get('boundingBox');
            bb.on('mouseenter',Y.bind(function(e){
                this.timer.pause();
            },this));
            
            bb.on('mouseleave',Y.bind(function(e){
                this.timer.resume();
            },this));
        }
    },{
        /**
         * Static property used to define the default attribute
         * configuration for Message.
         * 
         * @property ATTRS
         * @type Object
         * @static
         */
        ATTRS : {
	        /**
	         * @description A flag when set to true will allow
	         * a close button to be rendered in the message
	         * 
	         * @attribute closable
	         * @type Boolean
	         * @default true
	         */
            closable : {
                value : true,
                validator : Y.Lang.isBoolean
            },
            
            /**
             * @description The callback method that fires when the 
             * timer interval is reached.
             * 
             * @attribute closeNode
             * @type Y.Node
             */
            closeNode : {
                validator : function(val) {
                    return (val instanceof Y.Node);
                }
            },
    
            /**
             * @description String that is to be displayed
             * 
             * @attribute message
             * @type String
             */
            message : {
                validator : Y.Lang.isString
            },
            
            /**
             * @description Time in milliseconds before the message goes away
             * 
             * @attribute timeout
             * @type Number
             * @default 8000
             */
            timeout : {
                value : 8000
            },
            
            /**
             * @description Classification of message [error, alert, notice] 
             * 
             * @attribute flag
             * @type String
             * @default notice
             */
            flag : {
                value : 'notice',
                validator : function(val) {
                    if(Y.Lang.isString(val)) {
                        switch(val) {
                            case 'error': // overflow intentional
                            case 'alert':
                            case 'notice':
                                return true;
                        }
                    }
                    
                    return false;
                }
            }
        }
    });

    /**
     * Add Message to Y.Notify namespace
     */
    Y.namespace('Notify').Message = Message;
    
    /**
     * Notify is created as a Parent Widget
     */
    Notify = Y.Base.create('notify',Y.Widget,[Y.WidgetParent, Y.EventTarget],{
    	/**
    	 * Override default widget templates
    	 */
        CONTENT_TEMPLATE : '<ul/>',

        /**
         * Object used to build the child widget when new message are added
         *
         * @method childConfig
         * @protected
         */
        _childConfig : {},
        
        /**
         * Initializer lifecycle implementation for the Notify class.
         * Publishes events and subscribes 
         * to update after the status is changed. Builds initial child
         * widget configuration
         *
         * @method initializer
         * @public
         * @param confit {Object} Configuration object literal for
         *     the Notify
         */
        initializer : function(config) {
            this.publish(EVENTS.INIT,{ broadcast:1 });
            this.publish(EVENTS.STARTED,{ broadcast:1 });
            this.fire(EVENTS.INIT);
            this._buildChildConfig();
        },
        
        /**
         * Fires the 'started' event
         * 
         * @method syncUI
         * @public
         */
        syncUI : function() {
            this.fire(EVENTS.STARTED);
        },
        
        /**
         * Creates a new Message and appends at the specified index
         * 
         * @method addMessage
         * @public
         * @param msg {String} Message to be displayed
         * @param flag {String} Classification of message
         * @param index {Number} Stack order
         */
        addMessage : function(msg, flag, index) {
            var flag = flag || 'notice';
            this._buildChildConfig(msg,flag);

            if(index) {
                return this.add(this._childConfig,index);
            }
            if(this.get('prepend')) {
                return this.add(this._childConfig,0);
            }
            
            return this.add(this._childConfig);
        },
        
        /**
         * Allows for multiple message to be added at one time
         * 
         * @method addMessages
         * @public
         * @param obj
         */
        addMessages : function(obj) {
            for(var o in obj) {
                if(Y.Lang.isArray(obj[o])) {
                    for(var i=0, l=obj[o].length; i<l; i++) {
                        this.addMessage(obj[o][i],o);
                    }
                }
            }
        },

        /**
         * Populates the child config for new Message
         * 
         * @method _buildChildConfig
         * @param msg {String} Message to be displayed
         * @param flag {String} Classification of message
         */
        _buildChildConfig : function(msg,flag) {
            this._childConfig = {
                closable : this.get('closable'),
                timeout : this.get('timeout'),
                message : msg,
                flag : flag
            };
        }
        
    },{
        /**
         * Static property used to define the default attribute
         * configuration for the Timer.
         * 
         * @property ATTRS
         * @type Object
         * @static
         */
        ATTRS : {
	        /**
	         * Specifies if messages attached will have a close button
	         * 
	         * @attribute closable
	         * @type Boolean
	         * @default true
	         */
            closable : {
                value : true,
                validator : Y.Lang.isBoolean
            },
            
            /**
             * Default child used when using builtin add() method
             * 
             * @attribute add
             * @type Y.WidgetChild
             * @default Y.Notify.Message
             */
            defaultChildType : {
                value : Y.Notify.Message
            },
            
            /**
             * Specified if new message should be added to the top of
             * the message stack or the bottom.
             * 
             * @attribute prepend
             * @type Boolean
             * @default false
             */
            prepend : {
                value : false,
                validator : Y.Lang.isBoolean
            },
            
            /**
             * Time in milliseconds before new messages go away
             * 
             * @attribute timeout
             * @type Number
             * @default 8000
             */
            timeout : {
                value : 8000
            }
        },
        /**
         * Static property provides public access to registered notify
         * event strings
         * 
         * @property EVENTS
         * @type Object
         * @static
         */
        EVENTS : EVENTS
    });
    
    /**
     * Add Notify to Y namespace
     */
    Y.Notify = Notify;

