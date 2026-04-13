package service

import (
	"reflect"
	"strings"
	"unicode"

	"github.com/go-playground/locales/en"
	ut "github.com/go-playground/universal-translator"
	"github.com/go-playground/validator/v10"
	en_translations "github.com/go-playground/validator/v10/translations/en"
	"github.com/knnedy/nafasi/internal/response"
)

func newValidator() (*validator.Validate, ut.Translator) {
	enLocale := en.New()
	uni := ut.New(enLocale, enLocale)
	trans, _ := uni.GetTranslator("en")

	validate := validator.New()

	validate.RegisterTagNameFunc(func(fld reflect.StructField) string {
		name := strings.SplitN(fld.Tag.Get("json"), ",", 2)[0]
		if name == "-" {
			return ""
		}
		return name
	})

	en_translations.RegisterDefaultTranslations(validate, trans)

	validate.RegisterValidation("has_upper", func(fl validator.FieldLevel) bool {
		for _, c := range fl.Field().String() {
			if unicode.IsUpper(c) {
				return true
			}
		}
		return false
	})

	validate.RegisterValidation("has_lower", func(fl validator.FieldLevel) bool {
		for _, c := range fl.Field().String() {
			if unicode.IsLower(c) {
				return true
			}
		}
		return false
	})

	validate.RegisterValidation("has_number", func(fl validator.FieldLevel) bool {
		for _, c := range fl.Field().String() {
			if unicode.IsNumber(c) {
				return true
			}
		}
		return false
	})

	validate.RegisterValidation("has_special", func(fl validator.FieldLevel) bool {
		for _, c := range fl.Field().String() {
			if unicode.IsPunct(c) || unicode.IsSymbol(c) {
				return true
			}
		}
		return false
	})

	registerTranslation(validate, trans, "has_upper", "password must contain at least one uppercase letter")
	registerTranslation(validate, trans, "has_lower", "password must contain at least one lowercase letter")
	registerTranslation(validate, trans, "has_number", "password must contain at least one number")
	registerTranslation(validate, trans, "has_special", "password must contain at least one special character")

	return validate, trans
}

func registerTranslation(validate *validator.Validate, trans ut.Translator, tag string, msg string) {
	validate.RegisterTranslation(tag, trans, func(ut ut.Translator) error {
		return ut.Add(tag, msg, true)
	}, func(ut ut.Translator, fe validator.FieldError) string {
		t, _ := ut.T(tag, fe.Field())
		return t
	})
}

func formatValidationError(err error, trans ut.Translator) error {
	validationErrors := err.(validator.ValidationErrors)
	firstErr := validationErrors[0]
	return &response.ValidationError{
		Field:   firstErr.Field(),
		Message: firstErr.Translate(trans),
	}
}
