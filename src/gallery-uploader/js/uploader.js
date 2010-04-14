/**
 * Provides Uploader widget
 *
 * @module gallery-uploader
 */

// local constants

// TODO don't highlight Upload until certain number of files condidtion is met ... 
// exactly 2 or more than 5 or less than 3 files are selected ...
// Actually, webdev should add this logic by listening to events and 
// accepting / rejecting files




var getCN = Y.ClassNameManager.getClassName,

	UPLOADER = "uploader",
	CONTENT_BOX = "contentBox",

	// class names
	LABEL  = "label",
	HEADER = "hd",
	BODY   = "bd",
	FOOTER = "ft",
	ENTRY  = "entry",
	BG     = "bg",

	// event names
	FILE_ADDED     = "FileAdded",	  
	FILE_REMOVED   = "FileRemoved",
	FILE_UPLOADED  = "FileUploaded",
	FILE_PROGRESS  = "FileProgress",

	FILES_CHANGED  = "FilesChanged",
	FILES_PROGRESS = "FilesProgress", // percentage of all total
	FILES_UPLOADED = "FilesUploaded", // sent after all files uploaded


	MB = 1024*1024,
	
	// BrowserPlus Services
	SERVICES = [
		{ service: "Uploader", version: "3", minversion: "3.2.10" },
		{ service: "DragAndDrop", version: "2" },
		{ service: "Directory", version: "2" },
		{ service: "FileBrowse", version: "2" },
		{ service: "Archiver", version: "1" }
	];




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

/**
 * The identity of the widget.
 *
 * @property UPLOADER
 * @type String
 * @static
 */
Uploader.NAME = UPLOADER;

/**
 * Attribute configuration for the Uploader widget.
 * 
 * @property Upload.ATTRS
 * @type Object
 * @static
 */
Uploader.ATTRS = {
	
	/**
	 * Maximum size in bytes of a single file.	Default is 2MB.	 Set size to 0 or 
	 * less for no limit.
	 *
	 * @attribute maxFileSize
	 * @type Number
	 * @default 2097152 (2MB)
	 */
	maxFileSize: {
		value: 2*MB,
		validator: Y.isNumber
	},
	
	/**
     * @description An array of mimeTypes for which the selected files will be filtered
     *
     * @attribute mimeTypes
     * @default []
     * @type Array
     */
	mimeTypes: {
		value: [],
		validator: Y.Lang.isArray
	},

	/**
	 * The optional cookie string POSTed to server during upload.
	 *
	 * @attribute cookie
	 * @type String
	 * @default null (cookie not sent)
	 */
	cookie: {
		value: null
	},

	/**
	 * Array of files that are going to be uploaded.  Each file is a object that
	 * contains {name, size, TBD}.
	 * 
	 * @attribute files
	 * @readOnly
	 * @default []
	 * @type Array
	 */
	files: {
		value: [],
		readOnly: true,
		validator: Y.Lang.isArray
	},
	
	/**
	 * Returns true when files are actively being uploaded.
	 * @attribute isUploading
	 * @readOnly
	 * @default false
	 * @type Boolean
	 */
	isUploading: {
		value: false,
		readOnly: true
	},

	/**
	 * Returns the current file upload percentage.
	 * @attribute files
	 * @readOnly
	 * @default 0
	 * @type Number
	 */
	progress: {
		value: 0,
		readOnly: true
	},

	/**
	 * The localizable strings for the Uploader.
	 */
	strings: {
		value: {
			filename:		 "File",
			size:			 "Size",
			upload_complete: "Upload Complete!",
			add_files:		 "Add Files...",
			upload:			 "Upload",
			total:			 "Total:",
			size_b:			 " B",
			size_kb:		 " KB",				   
			size_mb:		 " MB",
			size_gb:		 " GB",
			size_tb:		 " TB"
		}
	}
};

/**
 * Map (object) of classNames used to populate the placeholders in the
 * Uploader.ENTRY_TEMPLATE markup when rendering a new Uploader entry.
 *
 * @property Upload.ENTRY_CSS
 * @type Object
 * @static
 */
Uploader.ENTRY_CSS = {
	entry_class	 : getCN(UPLOADER, ENTRY),
	entry_sel	 : getCN(UPLOADER, ENTRY, "selected"),
	entry_name	 : getCN(UPLOADER, ENTRY, "name"),
	entry_size	 : getCN(UPLOADER, ENTRY, "size"),
	entry_action : getCN(UPLOADER, ENTRY, "action")
};

/**
 * Map (object) of classNames used to populate the placeholders in the
 * Uploader.HEADER_TEMPLATE, Uploader.BODY_TEMPLATE, and
 * Uploader.FOOTER_TEMPLATE markup when rendering the Uploader UI.
 *
 * @property Uploader.CHROME_CSS
 * @type Object
 * @static
 */
Uploader.CHROME_CSS = {
	hd_class		: getCN(UPLOADER, HEADER),
	bd_class		: getCN(UPLOADER, BODY),
	ft_class		: getCN(UPLOADER, FOOTER),
	bg_class		: getCN(UPLOADER, BG),
							
	hd_file_label	: getCN(UPLOADER, HEADER, "file",	LABEL),
	hd_size_label	: getCN(UPLOADER, HEADER, "size",	LABEL),
	hd_action_label : getCN(UPLOADER, HEADER, "action", LABEL),
	
	ft_files_class	: getCN(UPLOADER, FOOTER, "files"),
	ft_button_class : getCN(UPLOADER, FOOTER, "button"),
	ft_size_class	: getCN(UPLOADER, FOOTER, "size"),

	ft_size_label	: getCN(UPLOADER, FOOTER, "size",  LABEL),
	ft_total_label	: getCN(UPLOADER, FOOTER, "total", LABEL)
};

/**
 * Markup template used to generate the DOM structure for the header
 * section of the Uploader when it is rendered.
 *
 * @property Uploader.HEADER_TEMPLATE
 * @type String
 * @static
 */
Uploader.HEADER_TEMPLATE =
	'<div class="{hd_class} {bg_class}">' +
		'<div class="{hd_file_label}">{str_file}</div>' +
		'<div class="{hd_size_label}">{str_size}</div>' +
		'<div class="{hd_action_label}"></div>' +
	'</div>';

/**
 * Markup template used to generate the DOM structure for the Uploader body.
 *
 * @property Uploader.BODY_TEMPLATE
 * @type String
 * @static
 */
//Uploader.BODY_TEMPLATE = '<div class="yui-uploader-bd-err">Error</div><div class="{bd_class}"></div>';
Uploader.BODY_TEMPLATE = '<div class="{bd_class}"></div>';


/**
 * Markup template used to generate the DOM structure for a file.  A file
 * consists of a name, size and delete icon.
 *
 * @property Uploader.ENTRY_TEMPLATE
 * @type String
 * @static
 */
Uploader.ENTRY_TEMPLATE =
	'<div id="{str_guid}" class="{entry_class}">' + 
		'<div class="{entry_name}">{str_name}</div>' + 
		'<div class="{entry_size}">{str_size}</div>' + 
		'<div class="{entry_action}"></div>' + 
	'</div>';

/**
 * Markup template used to generate the DOM structure for the footer
 * section of the Uploader when it is rendered.
 *
 * @property Uploader.FOOTER_TEMPLATE
 * @type String
 * @static
 */
Uploader.FOOTER_TEMPLATE =
	'<div class="{ft_class} {bg_class}">'+
		'<div class="{ft_button_class}">' +
			'<button id="add_button" type="button">{str_add_files}</button>'+
			'<button disabled id="upload_button" type="button">{str_upload}</button>'+
		'</div>'+
		'<div class="{ft_size_class}">' +
			'<span class="{ft_total_label}">{str_total}</span> ' +
			'<span class="{ft_size_label}">{str_size}</span>' +
		'</div>'+
	'</div>';



Y.extend(Uploader, Y.Widget, {
	// Reference to the Node instance containing the header contents.
	_head: null,

	 // Reference to the Node instance that will house the console messages.
	_body: null,

	// Reference to the Node instance containing the footer contents.
	_foot: null,
	
	
	/** Convert number of bytes into human readable string (ala "2 MB") */
	getSizeInBytes: function(size) {
		var i, units = [
			this.get("strings.size_b"),
			this.get("strings.size_kb"),
			this.get("strings.size_mb"),
			this.get("strings.size_gb"),
			this.get("strings.size_tb")
		];

		for (i = 0; size > 1024; i++) { size /= 1024; }

		if (i < units.length) {
			return Math.round(size*10)/10 + units[i];
		} else {
			return "?";
		}
	},

	// return index of file indentified by 'id' or return -1
	_getFileIndex: function(id) {
		var i, len, files = this.get("files");
		for (i = 0, len = files.length; i < len; i++) {
			if (id === files[i].id) {
				return i;
			}
		}
		return -1;
	},

	// search through files array and return index of entry with same handle id.
	_getHandleIndex: function(handle) {
		var i, len, files = this.get("files");
		for (i = 0, len = files.length; i < len; i++) {
			if (handle === files[i].BrowserPlusHandleID) {
				return i;
			}
		}
		return -1;
	},

	_filesAdded: function(files) {
		var dirArgs = {files: files},
			mimeTypes = this.get("mimeTypes"),
			that = this;
		
		Y.log("_filesAdded");
		if (mimeTypes.length > 0) { dirArgs.mimetypes = this.get("mimeTypes"); }

		BrowserPlus.Directory.recursiveList(dirArgs, function(res) {
			var i, file, files, maxFileSize;

			if (!res.success) { return; }

			maxFileSize = that.get("maxFileSize");

			files = res.value.files;
			for (i = 0; i < files.length; i++) {
				file = files[i];

				// don't add duplicate files
 				if (that._getHandleIndex(file.BrowserPlusHandleID) === -1) {
					// ignore directories, only care about files now
					if (file.mimeType[0] === "application/x-folder") { continue; }

					// if there's no max set OR file size < max, add file to Uploader
					if (maxFileSize < 1 || file.size <= maxFileSize) {
						file.id = Y.guid().replace(/-/g, "_");
						that.fire(FILE_ADDED, { file: file });
					}
				}
			}

			// done adding files, fire meta event
			that.fire(FILES_CHANGED);
		});
	},

	
	/** Display just added file in UI */
	_fileAddedEvent: function(e) {
		Y.log("fileAddedEvent:");
		Y.log(e.file);
		// remember file
		this.get("files").push(e.file);

		
		// add file to ui
		var info = Y.merge(Uploader.ENTRY_CSS, {
			str_guid : e.file.id,
			str_name : e.file.name,
			str_size : this.getSizeInBytes(e.file.size)
		});

		this._body.append(Y.substitute(Uploader.ENTRY_TEMPLATE, info));
	},

	// TODO - remove me, for dbg only
	printfiles: function() {
		var i, files = this.get("files");
		for (i = 0; i < files.length; i++) {
			Y.log("...[" + i + "] " + files[i].id + " " + files[i].name);
		}
	},

	_fileRemovedEvent: function(e) {
		var index = this._getFileIndex(e.file.id);
		if (index !== -1) {
			Y.log("File Removed Event: index=" +index + ", id="+ e.file.id);
			this.get("files").splice(index, 1); // changes array in place
			Y.one("#"+e.file.id).remove(); // remove from UI
		}
	},

	_filesChangedEvent: function() {
		Y.log("File Changed Event");

		// disable upload button when there are no files
		this.get(CONTENT_BOX).query('#upload_button').set("disabled", (this.get("files").length < 1));
	},

	/** User clicked Add Files... BrowserPlus.OpenBrowseDialog classed */
	_fileBrowser: function(e) {
		var that = this;

		YAHOO.bp.FileBrowse.OpenBrowseDialog({}, function(r) {
			if (r.success) {
				that._filesAdded(r.value.files);
			} else {
				alert("ERROR: " + r.error + " : " + r.verboseError);
			}
		});
	},
	
	// return the nearest ancestor (including the given node) with the specified className
	_getNodeOrAncestorWithClass: function(node, cn) {
		if (node.get("className") === cn) {
			return node;
		} else {
			return node.ancestor(function(n){return (n.get("className") === cn);});
		}
	},


	// user clicked in uploader body - see if click is on delete button
	_fileClickEvent: function(e) {
		var node = e.target, cn = node.get("className"), index, i;

		// clicked on delete action
		if (cn === Uploader.ENTRY_CSS.entry_action) {
			// find nearest file entry
			node = this._getNodeOrAncestorWithClass(node, Uploader.ENTRY_CSS.entry_class);
			if (node) {
				e.preventDefault();

				// user clicked on REMOVE action
				index = this._getFileIndex(node.get("id"));
					
				if (index != -1) {
					this.fire(FILE_REMOVED, {file: this.get("files")[index]});
					this.fire(FILES_CHANGED);
				}
			}
		}
	},

	/**
	 * Attach BrowserPlus specific events to UI after BrowserPlus has been initialized.
	 *
	 * @method _binder
	 * @protected
	 */
	 _binder: function() {
		//Y.log("internal binder called!!" + this);
		this.get(CONTENT_BOX).query('#add_button').on("click", this._fileBrowser,this);
		this._body.on("click", this._fileClickEvent, this);
	},

	/**
	 * Create the DOM structure for the header elements.
	 *
	 * @method _initHead
	 * @protected
	 */
	_initHead : function () {
		var cb	 = this.get(CONTENT_BOX),
			info = Y.merge(Uploader.CHROME_CSS, {
						str_file : this.get('strings.filename'),
						str_size : this.get('strings.size')
					});

		//Y.log("init head");
		this._head = Y.Node.create(Y.substitute(Uploader.HEADER_TEMPLATE, info));
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
		//Y.log("init body");
		this._body = Y.Node.create(Y.substitute(Uploader.BODY_TEMPLATE, Uploader.CHROME_CSS));
		this.get(CONTENT_BOX).appendChild(this._body);
	},

	/**
	 * Create the DOM structure for the footer elements.
	 *
	 * @method _initFoot
	 * @protected
	 */
	_initFoot : function () {
		//Y.log("init footer");
		var info = Y.merge(Uploader.CHROME_CSS, {
						str_add_files	  : this.get('strings.add_files'),
						str_upload : this.get('strings.upload'),
						str_total  : this.get('strings.total'),
						str_size   : '0' + this.get('strings.size_kb')
					});

		this._foot = Y.Node.create(Y.substitute(Uploader.FOOTER_TEMPLATE, info));

		this.get(CONTENT_BOX).appendChild(this._foot);
	},

	initializer: function(){
		//Y.log("initializer");
		this.publish(FILE_ADDED);    // 1 file added
		this.publish(FILE_REMOVED);  // 1 file removed
		this.publish(FILES_CHANGED); // after files added or removed
	},
			  
	destructor: function(){
		//Y.log("destructor");
	},
	
	renderUI: function(){
		this._initHead();
		this._initBody();
		this._initFoot();
	},

	/**
	 * Initialize BrowserPlus and bind events to UI.
	 * @method bindUI
	 */
	bindUI: function(){
		//Y.log("bind ui");
		var that = this;

		this.after(FILE_ADDED, this._fileAddedEvent, this);
		this.after(FILE_REMOVED, this._fileRemovedEvent, this);
		this.after(FILES_CHANGED, this._filesChangedEvent, this);

		YAHOO.bp.init({},function(init) {
			if (init.success) {
				YAHOO.bp.require({services: SERVICES}, function(require) {
					if (require.success) {
						that._binder();
					}
				});
			}
		});
		
	},
	
	syncUI: function(){
		//Y.log("syncUI");
	}

});

Y.Base.build(Uploader.NAME, Uploader, {dynamic:false});
Y.namespace("BP.Uploader");
Y.BP.Uploader = Uploader;

