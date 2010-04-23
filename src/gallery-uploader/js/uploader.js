/**
 * Provides a file uploader widget that uploads to a URL using POST. Cross domain 
 * uploads are allowed if the destination host has a master policy file which 
 * allows uploads from the source domain  (crossdomain.xml).
 *
 * Uploading to HTTPS is not supported at this time by the BrowserPlus Uploader service.
 * 
 *
 * @module gallery-uploader
 */

// IDEAS
// - make resizing and archivng "plugins"
// - headless (no or minimal ui like yui2 flash uploader)


// local constants

var getCN = Y.ClassNameManager.getClassName,

	UPLOADER = "uploader",
	CONTENT_BOX = "contentBox",

	// class names
	LABEL  = "label",
	HEADER = "hd",
	BODY   = "bd",
	FOOTER = "ft",
	ENTRY  = "entry",
	BG	   = "bg",


	// EVENT NAMES

	// File List
	FILE_ADDED    = "fileAdded",	  
	FILE_REMOVED  = "fileRemoved",
	FILES_CHANGED = "filesChanged",
	
	// document events like this??  found in animation.js
    //    /**
    //    * @event tween
    //    * @description fires every frame of the animation.
    //    * @param {Event} ev The tween event.
    //    * @type Event.Custom
    //    */
    //    TWEEN = 'tween',

	// Image Resize
	RESIZE_START     = "resizeStart",
	RESIZE_PROGRESS  = "resizeProgress",	
	RESIZE_COMPLETE  = "resizeComplete",

	// Archive Events
	ARCHIVE_START    = "archiveStart",
	ARCHIVE_PROGRESS = "archiveProgress",
	ARCHIVE_COMPLETE = "archiveComplete",

	// Uploading
	UPLOAD_START     = "uploadStart",   // happens as soon as button is clicked
	UPLOAD_PROGRESS  = "uploadProgress",
	UPLOAD_RESPONSE  = "uploadResponse",
	UPLOAD_COMPLETE  = "uploadComplete",

	// Private Events
	INT_CLICKED      = "iUploadClicked",
    INT_RESIZED   	 = "iUploadResized",
    INT_ARCHIVED  	 = "iUploadArchived",


	MB = 1024*1024,
	
	// BrowserPlus Services
	SERVICES = [
		{ service: "Uploader", version: "3", minversion: "3.2.12" },
		{ service: "DragAndDrop", version: "2" },
		{ service: "Directory", version: "2" },
		{ service: "FileBrowse", version: "2" },
		{ service: "ImageAlter", version: "4" },
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
		validator: Y.Lang.isNumber
	},
	
	/**
	 * Maximum width of an uploaded image.	By default, uploaded images are not resized.  Set this
	 * value to non-zero to restrict the size of an image.
	 *
	 * @attribute resizeWidth
	 * @type Number
	 * @default 0 (don't scale image)
	 */
	resizeWidth: {
		value: 0,
		validator: Y.Lang.isNumber
	},

	/**
	 * Maximum height of an uploaded image.	By default, uploaded images are not resized.  Set this
	 * value to non-zero to restrict the size of an image.
	 *
	 * @attribute resizeHeight
	 * @type Number
	 * @default 0 (don't scale image)
	 */
	resizeHeight: {
		value: 0,
		validator: Y.Lang.isNumber
	},

	/**
	 * The quality of the scaled image (0-100).	 Lower qualities result in faster operations and 
	 * smaller file sizes, at the cost of image quality.
	 * @attribute quality
	 * @type Number
	 * @default 80
	 */
	resizeQuality: {
		value: 80,
		validator: function(val) {return (Y.Lang.isNumber(val) && val >= 0 && val <= 100);}
	},
	
	
	/**
	 * Set the optional archive + compression format.  When set, all files will be archived
	 * and compressed (depending on the format) into a single file before upload.  Used
	 * in conjunction with image resizing, upload speed should improve with less bits
	 * sent over the wire.  Valid values: ('tar', 'tar-bzip2', 'tar-gzip', 'zip', 'zip-uncompressed').
	 *
	 * @attribute archiveFormat
	 * @type String
	 * @default null
	 */
	archiveFormat: {
		value: null,
		validator: function(val) {
			switch(val) {
				case 'zip':
				case 'zip-uncompressed':
				case 'tar':
				case 'tar-gzip':
				case 'tar-bzip2':
					return true;
				default:
					return false;
			}
		}
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
	 * The URL of the upload script on the server.	If this value is not set, 
	 * not files will be uploaded.
	 * 
	 * @attribute uploadUrl
	 * @default null
	 * @type String
	 */
	uploadUrl: {
		value: null
	},

	/**
	 * The name of the variable in the POST request containing the file data. "file" by default.
	 *
	 * @attribute fieldName
	 * @default file
	 * @type String
	 */
	fieldName: {
		value: "file",
		validator: Y.Lang.isString
	},

	/**
	 * The object containing variables to be sent in the same request as the file upload.
	 *
	 * @attribute vars
	 * @default null
	 * @type Object
	 */
	vars: {
		value:null,
		validator: Y.Lang.isObject
	},

	/**
	 * An optional integer value between 3 and 240s that places an upper bound in seconds on 
	 * how long to wait without being able to send or receive data from the server (i.e. while 
	 * server is processing uploaded content). Default is 240s.
	 * @attribute timeout
	 * @default 240
	 * @type Number
	 */
	timeout: {
		value: 240,
		validator: function(val) {return (Y.Lang.isNumber(val) && val >= 3 && val <= 240);}
	},

	/**
	 * The localizable strings for the Uploader.
	 */
	strings: {
		value: {
			filename:		  "File",
			size:			  "Size",
			close:    		  "Close",
			add_files:		  "Add Files...",
			drop_files:		  "Drop Files",
			upload:			  "Upload",
			total:			  "Total:",
			size_b:			  " B",
			size_kb:		  " KB",				   
			size_mb:		  " MB",
			size_gb:		  " GB",
			size_tb:		  " TB",
			resize_progress:  "Resizing Images",
			archive_progress: "Compressing Files",
			upload_progress:  "Uploading Files",
			upload_complete:   "Upload Complete!"
		}
	}
};

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
 * Map (object) of classNames used to populate the placeholders in the
 * Uploader.HEADER_TEMPLATE markup when rendering the Uploader UI.
 *
 * @property Uploader.HEADER_CSS
 * @type Object
 * @static
 */
Uploader.HEADER_CSS = {
	hd_class		: getCN(UPLOADER, HEADER),
	bg_class		: getCN(UPLOADER, BG),
	hd_file_label	: getCN(UPLOADER, HEADER, "file",	LABEL),
	hd_size_label	: getCN(UPLOADER, HEADER, "size",	LABEL),
	hd_action_label : getCN(UPLOADER, HEADER, "action", LABEL)
};

/**
 * Markup template used to generate the DOM structure for the Uploader body.
 *
 * @property Uploader.BODY_TEMPLATE
 * @type String
 * @static
 */
Uploader.BODY_TEMPLATE = 
	'<div>' +
		'<div id="{filelist_id}" class="{bd_class} {filelist_class}"></div>'+ 
		'<div style="visibility:hidden" class="{bd_class} {message_class}">' +
			'<div class="{message_text}"></div>'  +
			'<div class="{message_close}"><a href="#">{str_close}</a></div>'  +
		'</div>' +
		'<div style="visibility:hidden" class="{bd_class} {progress_class}">' + 
    		'<div class="{progress_bar} {progress_bg}"></div>' +
			'<div class="{progress_bar} {progress_fg}"></div>' +
			'<div class="{progress_text}">0%</div>' +
			'<div class="{progress_close}"><a href="#">{str_close}</a></div>'  +
		'</div>' +
		'<div style="visibility:hidden" class="{bd_class} {hover_class}">' + 
			'<div class="{hover_text}">{str_drop_files}</div>' + 
		'</div>' +
	'</div>';

/**
 * Map (object) of classNames used to populate the placeholders in the
 * Uploader.BODY_TEMPLATE markup when rendering the Uploader UI.
 *
 * @property Uploader.HEADER_CSS
 * @type Object
 * @static
 */
Uploader.BODY_CSS = {
	bd_class	   : getCN(UPLOADER, BODY),
	hover_class	   : getCN(UPLOADER, "hover"),
	hover_text	   : getCN(UPLOADER, "hover", "text"),
	filelist_class : getCN(UPLOADER, "filelist"),
	message_class  : getCN(UPLOADER, "message"),
	message_text   : getCN(UPLOADER, "message", "text"),
	message_close  : getCN(UPLOADER, "message", "close"),
	progress_class : getCN(UPLOADER, "progress"),
	progress_bar   : getCN(UPLOADER, "progress", "bar"),	
	progress_bg	   : getCN(UPLOADER, "progress", "bar", "bg"),
	progress_fg	   : getCN(UPLOADER, "progress", "bar", "fg"),
	progress_text  : getCN(UPLOADER, "progress", "bar", "text"),
	progress_close : getCN(UPLOADER, "progress", "close")
};

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
			'<button disabled class="{add_button}" type="button">{str_add_files}</button>'+
			'<button disabled class="{upload_button}" type="button">{str_upload}</button>'+
		'</div>'+
		'<div class="{ft_size_class}">' +
			'<span class="{ft_total_label}">{str_total}</span> ' +
			'<span class="{ft_size_label}">{str_size}</span>' +
		'</div>'+
	'</div>';

Uploader.FOOTER_CSS = {
	ft_class		: getCN(UPLOADER, FOOTER),
	bg_class		: getCN(UPLOADER, BG),

	ft_files_class	: getCN(UPLOADER, FOOTER, "files"),
	ft_button_class : getCN(UPLOADER, FOOTER, "button"),
	ft_size_class	: getCN(UPLOADER, FOOTER, "size"),

	add_button      : getCN(UPLOADER, "button", "add"),
	upload_button   : getCN(UPLOADER, "button", "upload"),

	ft_size_label	: getCN(UPLOADER, FOOTER, "size",  LABEL),
	ft_total_label	: getCN(UPLOADER, FOOTER, "total", LABEL)
};



Y.extend(Uploader, Y.Widget, {
	// the box this widget is renedered into
	_contentBox: null,
	
	 // Reference to the Node instance that will house the console messages.
	_body: null,
	
	// Reference to the Node instance containing the footer contents.
	_foot: null,

	// maybe need messages and progress too
	_filelist: null,

	// message that shows when user drags files over uploader body panel
	_hoverpane: null,

	// error message panel
	_messagepane: null,   // Message Pane
	_messagetext: null,   // Message displayed to user
	_messageclose: null,  // Close Button

	_progresspane: null,
	_progressbar: null,
	_progresstext: null,
	
	_addbutton: null,
	_uploadbutton: null,

	// map event names to user strings
	_progressStrings: null,
	
	/** Convert number of bytes into human readable string (ala "2 MB") */
	sizeInBytes: function(size) {
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

	/**
	 * Clears the list of files queued for upload.
	 */
	clearFileList: function() {
		var len = this.get("files").length;

		// remove file entries from ui
		this._filelist.all("." + Uploader.ENTRY_CSS.entry_class).remove();

		// remove files entries array
		this.get("files").splice(0, len); 

		this.fire(FILES_CHANGED);
	},
	
	disableInput: function(b) {
		this.set("disabledInput", b);
		this.enableAddButton(!b);
		this.enableUploadButton(!b && this.get("files").length > 0);
	},
	

	/**
	 * Set the enabled state of the Add Files button.
	 */
	enableAddButton: function(enabled) {
		this._addbutton.set("disabled", !enabled);
	},

	/**
	 * Set the enabled state of the Upload button.
	 */
	enableUploadButton: function(enabled) {
		this._uploadbutton.set("disabled", !enabled || this.get("uploadUrl") === null);
	},

	/**
	 * Disable the Uploader widget.
	 */
	disable: function() {
		Uploader.superclass.disable.call(this);
		this.disableInput(true);
	},

	/**
	 * Enable the Uploader widget.
	 */
	enable: function() {
		Uploader.superclass.enable.call(this);
		this.disableInput(false);
	},
	
	showMessage: function(msg) {
		this.disableInput(true);
		this._messagetext.setContent(msg);
		this._messagepane.setStyle("visibility", "visible");
	},

	hideMessage: function() {
		this.disableInput(false);
		this._messagepane.setStyle("visibility", "hidden");
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

	/**
	 * Add files to filelist UI.
	 *
	 * @method _addFilesToList
	 * @protected
	 * @param files {Array} files passed dropped or selected by user
	 */
	_addFilesToList: function(files) {
		var dirArgs = {files: files},
			mimeTypes = this.get("mimeTypes"),
			that = this;
		
		if (mimeTypes.length > 0) { dirArgs.mimetypes = this.get("mimeTypes"); }

		YAHOO.bp.Directory.recursiveList(dirArgs, function(res) {
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
	_fileAddedListener: function(e) {
		// remember file
		this.get("files").push(e.file);

		
		// add file to ui
		var css = Y.merge(Uploader.ENTRY_CSS, {
			str_guid : e.file.id,
			str_name : e.file.name,
			str_size : this.sizeInBytes(e.file.size)
		});

		this._filelist.append(Y.substitute(Uploader.ENTRY_TEMPLATE, css));
	},

	// TODO - remove me, for dbg only
	printfiles: function() {
		var i, files = this.get("files");
		for (i = 0; i < files.length; i++) {
			Y.log("...[" + i + "] " + files[i].id + " " + files[i].name);
		}
	},

	_fileRemovedListener: function(e) {
		var index = this._getFileIndex(e.file.id);
		if (index !== -1) {
			this.get("files").splice(index, 1); // changes array in place
			Y.one("#"+e.file.id).remove(); // remove from UI
		}
	},

	_filesChangedListener: function() {
		// disable upload button when there are no files
		var i, size=0, files = this.get("files"), numfiles = files.length;

		// only set enabled button when there are files in list to upload
		this.enableUploadButton(numfiles > 0);


		// recalculate total size
		for(i = 0; i < numfiles; i++) {
			size += files[i].size;
		}

		this.set("fileSize", size);
		this._foot.one("." + Uploader.FOOTER_CSS.ft_size_label).setContent(this.sizeInBytes(size));
	},


	_uploadStartListener: function(e) {
		this._progresstext.setContent("0%");
		this._progressbar.setStyle("width", "0%");
		this._progressclose.setStyle("visibility", "hidden");
		this._progresspane.setStyle("visibility", "visible");
	},

	/**
	 * Displays percentage complete for following: resizeProgress, archiveProgress, uploadProgress
	 */
	_progressListener: function(e) {
		var p = e.progress.totalPercent, t = this._progressStrings[e.type];
		this._progresstext.setContent(t + ": " + p + "%");
		this._progressbar.setStyle("width", p + "%");
	},

	_uploadCompleteListener: function(e) {
		// when upload is complete, show user "Upload Complete" message and
		// show "Close" button.  User presses "Close" and _hideProgress shows.
		this._progresstext.setContent(this.get("strings.upload_complete"));
		this._progressclose.setStyle("visibility", "visible");
	},


	/** User clicked Add Files... YAHOO.bp.OpenBrowseDialog classed */
	_openFileDialog: function(e) {
		if (this.get("disabledInput")) {return;}
		var that = this;

		YAHOO.bp.FileBrowse.OpenBrowseDialog({}, function(r) {
			if (r.success) {
				that._addFilesToList(r.value.files);
			}
		});
	},

	/**
	 * Returns true if file's mimetype matches a known image mime type (matches
	 * image/gif, image/jpeg, image/pjpeg, image/png)
	 */
	_isImage: function(f) {
		var i;
		for (i = 0; i < f.mimeType.length; i++) {
			switch(f.mimeType[i]) {
				case "image/gif":
				case "image/jpeg":
				case "image/pjpeg":
				case "image/png":
					return true;
				default:
					continue;
			}
		}
		
		return false;
	},
	
	/**
	 * Resize single file if it is an image.  To resize an image, the mimeType must be one of
	 * ("image/gif", "image/jpeg", "image/pjpeg", "image/png") and resizeWidth or resizeHeight must
	 * be more than 0.
	*/
	_resizeImage: function(file, cb) {
		var quality = this.get("resizeQuality"), 
			maxWidth = this.get("maxWidth"),
			maxHeight = this.get("maxHeight");

		YAHOO.bp.ImageAlter.transform({
				file : file,
				quality : quality,
				actions : [{ scale : { maxwidth: maxWidth, maxheight: maxHeight } }]
			}, function(res) { 
				cb((res.success ? res.value.file : file), true); // true - file is "image"
			}
		);
	},


	/**
	 * Step 1:  User clicks on Upload button.
	 */
	_uploadButtonClicked: function(e) {
		//Y.log("STEP 1: uploadButtonClicked");
		this.disableInput(true);
		this.fire(UPLOAD_START);
		this.fire(INT_CLICKED, {files: this.get("files") });
	},
	
	
	/**
	 * Step 2: Resize Images, if needed.
	 */
	_uploadResizeImages: function(e) {
		var i, files = e.files, numfiles = files.length, filesToUpload = [], 
			that = this,
			resizeCB,
			resizeValidator,
			maxWidth = this.get("resizeWidth"),
			maxHeight = this.get("resizeHeight"),
			numImagesToResize = 0,
			numImagesResized = 0,
			resizeStartEventSent = false;

		//Y.log("STEP 2: uploadResizeImages");

		// returns true if file is image and should be resized
		resizeValidator = function(file) {
			return ((maxWidth > 0 || maxHeight > 0) && that._isImage(file));
		};

		for (i = 0; i < numfiles; i++) {
			if (resizeValidator(files[i])) { numImagesToResize++; }
		}

		// _resizeImage callback
		resizeCB = function(f, isImage) {
			filesToUpload.push(f);

			// send progress events if we've actually resized an image
			if (isImage) {
				numImagesResized++;
				that.fire(RESIZE_PROGRESS, {
					file: f, 
					progress: {
						filePercent:  100, 
						totalPercent: Math.floor(numImagesResized / numImagesToResize * 100)
					}
				});
			}

			if (filesToUpload.length === numfiles) {
				// only send if there was a RESIZE_START
				if (numImagesResized > 0) { that.fire(RESIZE_COMPLETE); }

				// All done, send process files to the next stage
				that.fire(INT_RESIZED, {files: filesToUpload});
			}
		};

		for (i = 0; i < numfiles; i++) {
			if (resizeValidator(files[i])) {
				if (!resizeStartEventSent) {
					resizeStartEventSent = true;
					this.fire(RESIZE_START);
				}

				this.fire(RESIZE_PROGRESS, {
					file: files[i], 
					progress: {
						filePercent:  0, 
						totalPercent: Math.floor(numImagesResized / numImagesToResize * 100)
					}
				});

				this._resizeImage(files[i], resizeCB);
			} else {
				resizeCB(files[i], false);
			}
		}
	},

	/**
	 * Step 3: Archive (and compress) files, if needed.
	 */
	_uploadArchiveFiles: function(e) {
		var that = this, files = e.files, archiveFormat = this.get("archiveFormat");

		//Y.log("STEP 3: uploadArchiveFiles");

		if (archiveFormat) {
			this.fire(ARCHIVE_START);
			YAHOO.bp.Archiver.archive(
				{
					files:	files,
					format: archiveFormat,
					progressCallback: function(v) {	
						that.fire(ARCHIVE_PROGRESS, { 
							progress: {filePercent: v.percent, totalPercent: v.percent }
						});
					}
				},
				function(res) {
					var f = (res.success ? res.value.archiveFile : files );
					that.fire(ARCHIVE_COMPLETE);
					that.fire(INT_ARCHIVED, {files: [f]});
				}
			);

		} else {
			this.fire(INT_ARCHIVED, {files: files});
		}
	},

	/**
	 * Step 4: Files are process (images resized, files compressed).  Start the upload.
	 */
	_uploadStart: function(e) {
		var i, files = e.files, numfiles = files.length, 
			filesUploaded = 0,
			totalBytesToUpload = 0,
			byteCounter = {},
			uploadFunc, 
			that=this,
			uploadUrl = this.get("uploadUrl"), 
			fieldName = this.get("fieldName"), 
			timeout = this.get("timeout"),
			cookie = this.get("cookie"),
			vars = this.get("vars"),
			progressCallback;
			
		//Y.log("STEP 4: uploadStart");

		// calculate number of bytes to upload and create object to keep track of
		// number of bytes uploaded for each file
		for (i = 0; i < numfiles; i++) {
			totalBytesToUpload += files[i].size;
			byteCounter["id"+files[i].BrowserPlusHandleID] = 0;
		}

		// Sending 1 file at a time to get simulateneous uploads, so all "total" vals should be ignored
		// v is {file, filePercent, fileSent, fileSize, totalPercent, totalSent, totalSize}
		progressCallback = function(file) {
			// returning function here so we have "file" in closure
			return function(v) {
				var id, bytesSent = 0;

				byteCounter["id"+file.BrowserPlusHandleID] = v.fileSent;
			
				// count total bytes sent so far by summing number of bytes sent per file
				for (id in byteCounter) {
					if (byteCounter.hasOwnProperty(id)) { bytesSent += byteCounter[id]; }
				}

				that.fire(UPLOAD_PROGRESS, {
					file: file,
					progress: {
						fileSent: v.fileSent,
						fileSize: v.fileSize,
						filePercent: v.filePercent,
						totalSent: bytesSent,
						totalSize: totalBytesToUpload,
						totalPercent: Math.floor(bytesSent / totalBytesToUpload * 100)
					}
				});
			};
		};
		
		
		uploadFunc = function(file) {
			var fp = {}, params = {};
			
			// the file POST field name is custom
			fp[fieldName] = file;

			params.url = uploadUrl;
			params.files = fp;
			params.timeout = timeout;
			params.progressCallback = progressCallback(file);
			if (vars)   { params.postvars = vars; }
			if (cookie) { params.cookies = cookie; }

			YAHOO.bp.Uploader.upload(params, function(r) {
				var data;

				if (r.success) {
					data = {
						statusCode: r.value.statusCode, 
						statusString: r.value.statusString, 
						headers: r.value.headers,
						body: r.value.body
					};
				} else {
					data = {
						error: r.error, 
						verboseError: r.verboseError
					};
				}

				that.fire(UPLOAD_RESPONSE, {response: data});

				if (++filesUploaded == numfiles) {
					that.fire(UPLOAD_COMPLETE);
				}
			}); 
		};

		for (i = 0; i < numfiles; i++) {
			uploadFunc(files[i]);
		}
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
		if (this.get("disabledInput")) {return;}

		var node = e.target, cn = node.get("className"), index;

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
	 * Create the DOM structure for the header elements.
	 *
	 * @method _initHead
	 * @protected
	 */
	_initHead : function () {
		var node,
			css = Y.merge(Uploader.HEADER_CSS, {
					str_file : this.get('strings.filename'),
					str_size : this.get('strings.size')
				});

		node = Y.Node.create(Y.substitute(Uploader.HEADER_TEMPLATE, css));
		this._contentBox.insertBefore(node, this._contentBox.get('firstChild'));
	},

	/**
	 * Create the DOM structure for the console body&#8212;where messages are
	 * rendered.
	 *
	 * @method _initBody
	 * @protected
	 */
	_initBody : function () {
		var id = Y.guid(),
			css = Y.merge(Uploader.BODY_CSS, { 
				filelist_id	   : id ,
				str_drop_files : this.get('strings.drop_files'),
				str_close      : this.get("strings.close")
			});

		this._body = Y.Node.create(Y.substitute(Uploader.BODY_TEMPLATE, css));
		this._contentBox.appendChild(this._body);

		this._filelist      = this._body.one("." + css.filelist_class);
		this._hoverpane     = this._body.one("." + css.hover_class);
		this._messagepane   = this._body.one("." + css.message_class);
		this._messagetext   = this._body.one("." + css.message_text);
		this._messageclose  = this._body.one("." + css.message_close);
		this._progresspane  = this._body.one("." + css.progress_class);
		this._progressbar   = this._body.one("." + css.progress_fg);
		this._progresstext  = this._body.one("." + css.progress_text);
		this._progressclose = this._body.one("." + css.progress_close);

		this._progressStrings = {
			"uploader:resizeProgress":  this.get("strings.resize_progress"),
			"uploader:archiveProgress": this.get("strings.archive_progress"),
			"uploader:uploadProgress":  this.get("strings.upload_progress")
		};
	},

	/**
	 * Create the DOM structure for the footer elements.
	 *
	 * @method _initFoot
	 * @protected
	 */
	_initFoot : function () {
		var css = Y.merge(Uploader.FOOTER_CSS, {
			str_add_files : this.get('strings.add_files'),
			str_upload	  : this.get('strings.upload'),
			str_total	  : this.get('strings.total'),
			str_size	  : '0' + this.get('strings.size_kb')
		});

		this._foot = Y.Node.create(Y.substitute(Uploader.FOOTER_TEMPLATE, css));
		this._contentBox.appendChild(this._foot);

		this._addbutton    = this._foot.one("." + css.add_button);
		this._uploadbutton = this._foot.one("." + css.upload_button);
	},

	initializer: function(){
		this.publish(FILE_ADDED);	 // 1 file added
		this.publish(FILE_REMOVED);	 // 1 file removed
		this.publish(FILES_CHANGED); // after files added or removed

		this.publish(RESIZE_START); 
		this.publish(RESIZE_PROGRESS); 
		this.publish(RESIZE_COMPLETE); 
		
		this.publish(ARCHIVE_START);
		this.publish(ARCHIVE_PROGRESS);
		this.publish(ARCHIVE_COMPLETE);

		this.publish(UPLOAD_START);
		this.publish(UPLOAD_PROGRESS);
		this.publish(UPLOAD_RESPONSE);
		this.publish(UPLOAD_COMPLETE);
	},
			  
	destructor: function() {
		// empty for now
	},
	
	renderUI: function(){
		// this widget's outer most box
		this._contentBox = this.get(CONTENT_BOX);

		this._initHead();
		this._initBody();
		this._initFoot();
	},

	/**
	 * Attach BrowserPlus specific events to UI after BrowserPlus has been initialized.
	 *
	 * @method _binder
	 * @protected
	 */
	 _binder: function() {
		var hover = this._hoverpane, id = this._filelist.get("id"), that = this;

		// User clicks on "Add Files" or "Upload" button

		this._addbutton.on("click", this._openFileDialog, this);
		this._uploadbutton.on("click", this._uploadButtonClicked, this);
		this._messageclose.on("click", this.hideMessage, this);
		this._progressclose.on("click", function(e) {
			this.clearFileList();
			this._progresspane.setStyle("visibility", "hidden");		
			this._progressclose.setStyle("visibility", "hidden");
			this.disableInput(false);
		}, this);

		// Use clicks in filelist are (click on trashcan icon to remove file)
		this._filelist.on("click", this._fileClickEvent, this);

		//---------------------
		// Custom Events

		// Triggered from OpenBrowseDialog and DragAndDrop, modifies UI to show files
		this.after(FILE_ADDED,    this._fileAddedListener, this);
		this.after(FILE_REMOVED,  this._fileRemovedListener, this);
		this.after(FILES_CHANGED, this._filesChangedListener, this);

		// Shows progress while uploading
		this.after(UPLOAD_START,     this._uploadStartListener, this);
		this.after(RESIZE_PROGRESS,  this._progressListener, this);
		this.after(ARCHIVE_PROGRESS, this._progressListener, this);
		this.after(UPLOAD_PROGRESS,  this._progressListener, this);
		this.after(UPLOAD_COMPLETE,  this._uploadCompleteListener, this);

		//
		//---------------------

		// Private Custom Events (not published)
		this.on(INT_CLICKED,  this._uploadResizeImages, this);
		this.on(INT_RESIZED,  this._uploadArchiveFiles, this);
		this.on(INT_ARCHIVED, this._uploadStart,        this);

		this.disableInput(false);

		YAHOO.bp.DragAndDrop.AddDropTarget({ id: id}, function (r) {
			if (!r.success) { return; }
			YAHOO.bp.DragAndDrop.AttachCallbacks({id: id, 
				hover: function(hovering) {
					if (that.get("disabledInput")) {return;}

					var visible = hover.getStyle("visibility");
					// only set property once
					if (hovering && visible != "visible") {
						hover.setStyle("visibility", "visible");
					} else if (!hovering && visible == "visible") {
						hover.setStyle("visibility", "hidden");
					}
				}, 
				drop: function(files) {
					if (that.get("disabledInput")) {return;}
					hover.setStyle("visibility", "hidden");
					that._addFilesToList(files);
				}
			},	function() {});
		});
	},

	/**
	 * Initialize BrowserPlus and bind events to UI.
	 * @method bindUI
	 */
	bindUI: function(){
		var that = this;

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
	
	syncUI: function() {
		// sync or bind, that is the question
	}

});

Y.Base.build(Uploader.NAME, Uploader, {dynamic:false});
Y.namespace("BP.Uploader");
Y.BP.Uploader = Uploader;

