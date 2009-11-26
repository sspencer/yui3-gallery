/**
 * Provides Uploader widget
 *
 * @module gallery-uploader
 */


/**
 * Uploader creates a file upload widget that allows the user to 
 * select or drag+drop multiple files from the desktop into it and
 * then upload multiple files at a time.
 *
 * @param config {Object} Object literal specifying Accordion configuration properties.
 *
 * @class Uploader
 * @constructor
 * @extends Widget
 */
function Uploader( config ){
    Uploader.superclass.constructor.apply( this, arguments );
}

// Local constants
var Lang = Y.Lang,

//    Node = Y.Node,
    isNumber = Lang.isNumber,

    substitute = Y.substitute,
    create     = Y.Node.create,
    merge      = Y.merge,

//    isString = Lang.isString,
    getCN = Y.ClassNameManager.getClassName,

    UPLOADER = 'uploader',
    CONSTRUCTOR = 'Uploader',
    NAMESPACE   = 'BP',

    CHECKED        = 'checked',
    CLEAR          = 'clear',
    CLICK          = 'click',
    COLLAPSED      = 'collapsed',
    CONTENT_BOX    = 'contentBox',
    DISABLED       = 'disabled',
    ENTRY          = 'entry',
    ERROR          = 'error',
    HEIGHT         = 'height',
    INFO           = 'info',
    INNER_HTML     = 'innerHTML',
    LAST_TIME      = 'lastTime',
    PAUSE          = 'pause',
    PAUSED         = 'paused',
    RESET          = 'reset',
    START_TIME     = 'startTime',
    TITLE          = 'title',
    WARN           = 'warn',
    
    // my real ones
    LABEL = 'label',
    FILE = 'file',
    SIZE = 'size',
    REMOVE = 'remove',

    DOT = '.',

    C_BUTTON           = getCN(UPLOADER,'button'),
    C_CHECKBOX         = getCN(UPLOADER,'checkbox'),
    C_CLEAR            = getCN(UPLOADER,CLEAR),
    C_COLLAPSE         = getCN(UPLOADER,'collapse'),
    C_COLLAPSED        = getCN(UPLOADER,COLLAPSED),
    C_UPLOADER_CONTROLS = getCN(UPLOADER,'controls'),
    C_UPLOADER_HD       = getCN(UPLOADER,'hd'),
    C_UPLOADER_BD       = getCN(UPLOADER,'bd'),
    C_UPLOADER_FT       = getCN(UPLOADER,'ft'),
    C_UPLOADER_TITLE    = getCN(UPLOADER,TITLE),

    // my real ones
    C_FILE_LABEL = getCN(UPLOADER, FILE, LABEL),
    C_SIZE_LABEL = getCN(UPLOADER, SIZE, LABEL),
    C_REMOVE_LABEL = getCN(UPLOADER, REMOVE, LABEL),
    
    C_ENTRY            = getCN(UPLOADER,ENTRY),
    C_ENTRY_CAT        = getCN(UPLOADER,ENTRY,'cat'),
    C_ENTRY_CONTENT    = getCN(UPLOADER,ENTRY,'content'),
    C_ENTRY_META       = getCN(UPLOADER,ENTRY,'meta'),
    C_ENTRY_SRC        = getCN(UPLOADER,ENTRY,'src'),
    C_ENTRY_TIME       = getCN(UPLOADER,ENTRY,'time'),
    C_PAUSE            = getCN(UPLOADER,PAUSE),
    C_PAUSE_LABEL      = getCN(UPLOADER,PAUSE,'label');


    


Y.mix(Uploader, {
    
    /**
     * The identity of the widget.
     *
     * @property Console.NAME
     * @type String
     * @static
     */
    NAME : UPLOADER,

    /**
     * Map (object) of classNames used to populate the placeholders in the
     * Console.ENTRY_TEMPLATE markup when rendering a new Console entry.
     *
     * <p>By default, the keys contained in the object are:</p>
     * <ul>
     *    <li>entry_class</li>
     *    <li>entry_meta_class</li>
     *    <li>entry_cat_class</li>
     *    <li>entry_src_class</li>
     *    <li>entry_time_class</li>
     *    <li>entry_content_class</li>
     * </ul>
     *
     * @property Console.ENTRY_CLASSES
     * @type Object
     * @static
     */
    ENTRY_CLASSES   : {
        entry_class         : C_ENTRY,
        entry_meta_class    : C_ENTRY_META,
        entry_cat_class     : C_ENTRY_CAT,
        entry_src_class     : C_ENTRY_SRC,
        entry_time_class    : C_ENTRY_TIME,
        entry_content_class : C_ENTRY_CONTENT
    },

    /**
     * Map (object) of classNames used to populate the placeholders in the
     * Console.HEADER_TEMPLATE, Console.BODY_TEMPLATE, and
     * Console.FOOTER_TEMPLATE markup when rendering the Console UI.
     *
     * <p>By default, the keys contained in the object are:</p>
     * <ul>
     *   <li>console_hd_class</li>
     *   <li>console_bd_class</li>
     *   <li>console_ft_class</li>
     *   <li>console_controls_class</li>
     *   <li>console_checkbox_class</li>
     *   <li>console_pause_class</li>
     *   <li>console_pause_label_class</li>
     *   <li>console_button_class</li>
     *   <li>console_clear_class</li>
     *   <li>console_collapse_class</li>
     *   <li>console_title_class</li>
     * </ul>
     *
     * @property Console.CHROME_CLASSES
     * @type Object
     * @static
     */
    CHROME_CLASSES  : {
        /*
        console_hd_class       : C_UPLOADER_HD,
        console_bd_class       : C_UPLOADER_BD,
        console_ft_class       : C_UPLOADER_FT,
        console_controls_class : C_UPLOADER_CONTROLS,
        console_checkbox_class : C_CHECKBOX,
        console_pause_class    : C_PAUSE,
        console_pause_label_class : C_PAUSE_LABEL,
        console_button_class   : C_BUTTON,
        console_clear_class    : C_CLEAR,
        console_collapse_class : C_COLLAPSE,
        console_title_class    : C_UPLOADER_TITLE,
        */
        
        uploader_hd_class           : C_UPLOADER_HD,
        uploader_bd_class           : C_UPLOADER_BD,
        uploader_ft_class           : C_UPLOADER_FT,
        uploader_file_label_class   : C_FILE_LABEL,
        uploader_size_label_class   : C_SIZE_LABEL,
        uploader_remove_label_class : C_REMOVE_LABEL
    },

    /**
     * Markup template used to generate the DOM structure for the header
     * section of the Console when it is rendered.  The template includes
     * these {placeholder}s:
     *
     * <ul>
     *   <li>console_button_class - contributed by Console.CHROME_CLASSES</li>
     *   <li>console_collapse_class - contributed by Console.CHROME_CLASSES</li>
     *   <li>console_hd_class - contributed by Console.CHROME_CLASSES</li>
     *   <li>console_title_class - contributed by Console.CHROME_CLASSES</li>
     *   <li>str_collapse - pulled from attribute strings.collapse</li>
     *   <li>str_title - pulled from attribute strings.title</li>
     * </ul>
     *
     * @property Console.HEADER_TEMPLATE
     * @type String
     * @static
     */
    OLDHEADER_TEMPLATE :
        '<div class="{console_hd_class}">'+
            '<h4 class="{console_title_class}">{str_title}</h4>'+
            '<button type="button" class="'+
                '{console_button_class} {console_collapse_class}">{str_collapse}'+
            '</button>'+
        '</div>',

    HEADER_TEMPLATE : 
        '<div class="{uploader_hd_class}">' +
            '<div class="{uploader_file_label_class}">{str_file}</div>' +
            '<div class="{uploader_size_label_class}">{str_size}</div>' +
            '<div class="{uploader_remove_label_class}">{str_remove}</div>' +
        '</div>',



    /**
     * Markup template used to generate the DOM structure for the Console body
     * (where the messages are inserted) when it is rendered.  The template
     * includes only the {placeholder} &quot;console_bd_class&quot;, which is
     * constributed by Console.CHROME_CLASSES.
     *
     * @property Console.BODY_TEMPLATE
     * @type String
     * @static
     */
    BODY_TEMPLATE : '<div class="{uploader_bd_class}">BODY HERE</div>',

    /**
     * Markup template used to generate the DOM structure for the footer
     * section of the Console when it is rendered.  The template includes
     * many of the {placeholder}s from Console.CHROME_CLASSES as well as:
     *
     * <ul>
     *   <li>id_guid - generated unique id, relates the label and checkbox</li>
     *   <li>str_pause - pulled from attribute strings.pause</li>
     *   <li>str_clear - pulled from attribute strings.clear</li>
     * </ul>
     *
     * @property Console.FOOTER_TEMPLATE
     * @type String
     * @static
     */
    FOOTER_TEMPLATE :
        '<div class="{uploader_ft_class}">'+
            '<div class="{console_controls_class}">'+
                '<label for="{id_guid}" class="{console_pause_label_class}">'+
                    '<input type="checkbox" class="{console_checkbox_class} '+
                        '{console_pause_class}" value="1" id="{id_guid}"> '+
                    '{str_pause}</label>' +
                '<button type="button" class="'+
                    '{console_button_class} {console_clear_class}">{str_clear}'+
                '</button>'+
            '</div>'+
        '</div>',

    /**
     * Static property used to define the default attribute configuration for the Uploader.
     * 
     * @property Accordion.ATTRS
     * @type Object
     * @static
     */
    ATTRS : {
    
        /**
         * String with units, or number, representing the height of the Uploader,
         * inclusive of header and footer. If a number is provided, the default
         * unit, defined by Widget's DEF_UNIT, property is used.
         *
         * @attribute height
         * @default "300px"
         * @type {String | Number}
         */
        height: {
            value: "300px"
        },

        /**
         * String with units, or number, representing the width of the Uploader.
         * If a number is provided, the default unit, defined by Widget's
         * DEF_UNIT, property is used.
         *
         * @attribute width
         * @default "600px"
         * @type {String | Number}
         */
        width: {
            value: "600px"
        },

        /**
         * Maximum size in bytes of a single file.  Default is no limit.
         * @attribute printTimeout
         * @type Number
         * @default 0
         */
        maxFileSize: {
            value: 0,
            validator: isNumber
        },
    
        /**
         * Archive and compress all files into a single ZIP file before upload.
         *
         * @attribute zipFiles
         * @type Boolean
         * @default false
         */
        zipFiles : {
            value : false
        },

        strings: {
            value: {
                file: "File",
                files: "Files",
                size: "Size",
                remove: "Remove?",
                removeHelp: "Remove file from list",
                done: "Upload Complete!",
                browser: "Browse...",
                upload: "Upload",
                total: "Total"

            }
        }
    }
});

Y.extend(Uploader, Y.Widget, {
    /**
     * Reference to the Node instance containing the header contents.
     *
     * @property _head
     * @type Node
     * @default null
     * @protected
     */
    _head    : null,

    /**
     * Reference to the Node instance that will house the console messages.
     *
     * @property _body
     * @type Node
     * @default null
     * @protected
     */
    _body    : null,

    /**
     * Reference to the Node instance containing the footer contents.
     *
     * @property _foot
     * @type Node
     * @default null
     * @protected
     */
    _foot    : null,

    initializer:function(){
        Y.log("initializer");
    },
              
    destructor: function(){
        Y.log("destructor");
    },
    
    renderUI: function(){
        var cb = this.get(CONTENT_BOX);
        Y.log("renderUI, cb="+cb);

        this._initHead();
        this._initBody();
        this._initFoot();
    },

    bindUI: function(){
        Y.log("bind ui");
    },
    
    syncUI: function(){
        Y.log("syncUI");
    },

    /**
     * Create the DOM structure for the header elements.
     *
     * @method _initHead
     * @protected
     */
    _initHead : function () {
        var cb   = this.get(CONTENT_BOX),
            info = merge(Uploader.CHROME_CLASSES, {
                        str_file : this.get('strings.file'),
                        str_size : this.get('strings.size'),
                        str_remove : this.get('strings.remove')
                    });

        this._head = create(substitute(Uploader.HEADER_TEMPLATE, info));

        cb.insertBefore(this._head,cb.get('firstChild'));
    },

    /**
     * Create the DOM structure for the console body&#8212;where messages are
     * rendered.
     *
     * @method _initBody
     * @protected
     */
    _initBody : function () {
        this._body = create(substitute(
                            Uploader.BODY_TEMPLATE,
                            Uploader.CHROME_CLASSES));

        this.get(CONTENT_BOX).appendChild(this._body);
    },

    /**
     * Create the DOM structure for the footer elements.
     *
     * @method _initFoot
     * @protected
     */
    _initFoot : function () {
        this._foot = create(substitute(Uploader.FOOTER_TEMPLATE,Uploader.CHROME_CLASSES));

        this.get(CONTENT_BOX).appendChild(this._foot);
    }

});

Y.Base.build(Uploader.NAME, Uploader, {dynamic:false});
Y.namespace(NAMESPACE +'.'+CONSTRUCTOR);
Y[NAMESPACE][CONSTRUCTOR] = Uploader;
