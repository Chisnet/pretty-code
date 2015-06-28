/* Pretty Code v0.14 */
(function(window){
    var escape_html = function(string) {
        var escaped_string = '';
        // Create map of replacements
        var html_replacements = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;',
            '`': '&#x60;'
        };
        // Find and replace any occurences
        escaped_string = string.replace(/&|<|>|"|'|`/g, function(match) {
            return html_replacements[match];
        });

        return escaped_string;
    };
    var pretty = {
        parse: function(data, data_type) {
            var func_name = 'parse_' + data_type;
            try {
                return '<div class="pretty_output pretty_' + data_type + '">' + this[func_name](data) + '</div>';
            }
            catch(e) {
                // If anything can't be processed for whatever reason just return false
                return false;
            }
        },
        parse_json: function(data) {
            // Attempt a load so we can handle Objects and Strings
            try {data = JSON.parse(data);}
            catch(e) {}

            var result = '';
            // Find the type of JSON data we've been given
            var value_type = data == null ? 'null' : data.constructor.name.toLowerCase();
            // Based on the type of the data process/format accordingly
            switch(value_type) {
                case 'object':
                    // If we're dealing with an object process it's children recursively
                    var children = '';
                    var key_num=0, key_count = Object.keys(data).length;
                    for(child in data) {
                        children += '<li><span class="key">"' + child + '":</span> ' + this.parse_json(data[child]) + (key_num<key_count-1 ? ',' : '') + '</li>';
                        key_num++;
                    }
                    result = '{' + ((children != '') ? '<ul>' + children + '</ul>' : '') + '}';
                    break;
                case 'array':
                    // If we're dealing with an array process it's elements recursively 
                    var elements = '';
                    for(var i=0; i<data.length; i++) {
                        var element = data[i];
                        elements += '<li>' + this.parse_json(element) + (i<data.length-1 ? ',' : '') + '</li>';
                    }
                    result = '[' + ((elements != '') ? '<ul>' + elements + '</ul>' : '') + ']';
                    break;
                case 'null':
                    // Null's are a special highlighting case
                    result = '<span class="null">null</span>';
                    break;
                case 'string':
                    // String need additional quotes to be valid JSON
                    result = '<span class="string">"' + escape_html(data) + '"</span>';
                    break;
                default:
                    // Everything else can be simply displayed as is
                    result = '<span class="' + value_type + '">' + data + '</span>';
                    break;
            }
            return result;
        },
        parse_css: function(data) {
            // TODO - Attempt to be smart about ownership of in-line comments, unless we're processing compressed CSS when we can't tell.

            var result = '';
            var in_selector = false;
            var in_comment = false;
            var multiline_comment = false;
            var unused_string = '';
            
            var data_array = data.split(/({|}|;|\r\n|\n|\r|\/\*|\*\/)/);
            data_array = data_array.filter(function(e){return (!/^( )+$/.test(e) && e != '');});

            for(var i=0; i<data_array.length; i++) {
                var element = data_array[i];

                if(!/(\r\n|\n|\r)/.test(element)) {
                    element = element.trim();
                }
                // Comments
                if(/^\/\*/.test(element)) {
                    // Start of comment
                    unused_string += element + ' ';
                    in_comment = true;
                }
                else if(/^\*\//.test(element)) {
                    // End of comment
                    if(multiline_comment) {
                        result += '<div class="comment">' + unused_string + ' ' + element + '</div>';
                    }
                    else {
                        if(in_selector) {
                            result += '<li><span class="comment">' + unused_string + ' ' + element + '</span></li>';
                        }
                        else {
                            result += '<span class="comment">' + unused_string + ' ' + element + '</span>';
                        }
                    }
                    unused_string = '';
                    in_comment = false;
                    multiline_comment = false;
                }
                // New lines
                else if(/(\r\n|\n|\r)/.test(element)) {
                    // We only care about new-lines in comments to keep any multi-line comment formatting
                    if(in_comment) {
                        unused_string += '<br/>';
                        multiline_comment = true;
                    }
                }
                // Selector start
                else if(element == '{') {
                    if(in_comment) {
                        unused_string += ' ' + element;
                    }
                    else {
                        result += '<div>' + unused_string + ' {' + '<ul>';
                        unused_string = '';
                        in_selector = true;
                    }
                }
                // Selector end
                else if(element == '}') {
                    if(in_comment) {
                        unused_string += ' ' + element;
                    }
                    else {
                        result += '</ul>' + element + '</div>';
                        in_selector = false;
                    }
                }
                // Declaration
                else if(element == ';') {
                    result += '<li>' + unused_string + ';</li>';
                    unused_string = '';
                }
                // Everything else?
                else {
                    if(in_comment) {
                        unused_string += element;
                    }
                    else if(!in_selector){
                        unused_string += '<span class="selector">' + element.split(',').join('</span>, <span class="selector">') + '</span>';
                    }
                    else {
                        var declaration_parts = element.split(':');
                        var declaration_property = declaration_parts[0].trim();
                        declaration_parts.splice(0,1);
                        var declaration_value = declaration_parts.join('').trim();
                        unused_string += '<span class="property">' + declaration_property + '</span>: <span class="value">' + declaration_value + '</span>';
                    }
                }
            }
            return result;
        },
        parse_yaml: function(data) {
            // TODO - Handling for {} style YAML

            var result = '';
            var indent_level = 0;
            var indent_widths = [];
            var indent_start = false;

            var leading_spaces_regex = /^(\s)*/g;
            
            var data_array = data.split(/(?:\r\n|\n|\r)/);
            data_array = data_array.filter(function(e){return (!/^( )+$/.test(e) && e != '');});

            for(var i=0; i<data_array.length; i++) {
                var element = data_array[i];
                element = this.rtrim(element);

                // Start
                if(element == '---') {
                    result += '<div class="start">---</div>';
                }
                // Comments
                else if(/^#/.test(element)) {
                    result += '<div class="comment">' + element + '</div>';
                }
                // Key on own line (indentation)
                else if(/:$/.test(element)) {
                    var leading_spaces = element.match(leading_spaces_regex)[0].length;

                    // indent_level += 1;
                    // indent_start = true;

                    // result += '<div><span class="key">' + element + '</span>' + '<ul>';

                    result += '';
                }
                // Key with value line
                else if(/^(.*):(.*)$/.test(element)) {
                    var matched_string = element.match(/^(.*):(.*)$/);
                    var key = matched_string[1];
                    var value = matched_string[2].trim();
                    var leading_spaces = key.match(leading_spaces_regex)[0].length;

                    // Trim the space from around the key after we've determined the leading spaces
                    key = key.trim();

                    if (leading_spaces == 0) {
                        if (indent_level > 0) {
                            result += '</ul></div>';
                        }
                        // Reset all indentation
                        indent_level = 0;
                        indent_widths = [];
                        indent_start = false;
                        // Simple element in a dev
                        result += '<div><span class="key">' + key + ':</span> <span class="value">' + value + '</span></div>';
                    }
                    else {
                        if(indent_start) {
                            indent_level += 1;
                            indent_widths.push(leading_spaces);
                            indent_start = false;
                        }
                        result += '<li><span class="key">' + key + ':</span> <span class="value">' + value + '</span></li>';
                    }

                }

            }
            return result;
        },
        rtrim: function(str) {
            var rtrim_regex = /[\s\uFEFF\xA0]+$/g;
            return str.replace(rtrim_regex, '');
        }
    };
    if(typeof define === 'function' && define.amd) {
        define(function(){return pretty});
    }
    else {
        window.pretty = pretty;
    }
})(window);
